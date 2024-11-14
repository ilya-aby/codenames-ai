import wordlist from './assets/wordlist-eng.txt?raw';
import { ChatMessage } from './components/Chat';
import { agents, LLMModel } from './constants/models';
// Core types
export type TeamColor = 'red' | 'blue';
export type CardColor = 'red' | 'blue' | 'black' | 'neutral';
export type Role = 'spymaster' | 'operative';

export type CardType = {
  word: string;
  color: CardColor;
  isRevealed: boolean;
};

export type SpymasterMove = {
  clue: string;
  number: number;
  reasoning: string;
};

export type OperativeMove = {
  guesses: string[];
  reasoning: string;
};

// Nested object type for team agents to track which LLM model is being used for each role
export type TeamAgents = {
  [key in Role]: LLMModel;
};

export type GameAgents = {
  [key in TeamColor]: TeamAgents;
};

// Game state
export type GameState = {
  agents: GameAgents;
  cards: CardType[];
  chatHistory: ChatMessage[];
  currentTeam: TeamColor;
  currentRole: Role;
  remainingRed: number;
  remainingBlue: number;
  currentClue?: {
    clueText: string;
    number: number;
  };
  gameWinner?: TeamColor;
};

// Initialize new game state
export const initializeGameState = (): GameState => {
  return {
    cards: drawNewCards(),
    agents: selectRandomAgents(),
    currentTeam: 'red',
    currentRole: 'spymaster',
    remainingRed: 9,
    remainingBlue: 8,
    chatHistory: [],
  };
};

const drawNewCards = (): CardType[] => {
  const allWords = wordlist.split('\n').filter((word) => word.trim() !== '');
  const gameCards: CardType[] = [];

  // Randomly select 25 words
  const selectedWords = [];
  const tempWords = [...allWords];
  for (let i = 0; i < 25; i++) {
    const randomIndex = Math.floor(Math.random() * tempWords.length);
    selectedWords.push(tempWords[randomIndex]);
    tempWords.splice(randomIndex, 1);
  }

  // Team assignment counts for randomization
  const teams: CardColor[] = [
    ...Array(9).fill('red'),
    ...Array(8).fill('blue'),
    ...Array(1).fill('black'),
    ...Array(7).fill('neutral'),
  ];

  // Randomly assign teams to words
  selectedWords.forEach((word) => {
    const randomIndex = Math.floor(Math.random() * teams.length);
    gameCards.push({
      word,
      color: teams[randomIndex],
      isRevealed: false,
    });
    teams.splice(randomIndex, 1);
  });

  return gameCards;
};

// Select 4 random agents for each team
const selectRandomAgents = (): GameAgents => {
  const availableAgents = [...agents];

  const pickRandomAgent = () => {
    const randomIndex = Math.floor(Math.random() * availableAgents.length);
    return availableAgents.splice(randomIndex, 1)[0];
  };

  return {
    red: {
      spymaster: pickRandomAgent(),
      operative: pickRandomAgent(),
    },
    blue: {
      spymaster: pickRandomAgent(),
      operative: pickRandomAgent(),
    },
  } satisfies GameAgents;
};

// Set the guess properties and switch to operative role
export function updateGameStateFromSpymasterMove(
  currentState: GameState,
  move: SpymasterMove
): GameState {
  const newState = { ...currentState };
  newState.currentClue = {
    clueText: move.clue.toUpperCase(),
    number: move.number,
  };
  newState.chatHistory.push({
    message: move.reasoning + '\n\n' + move.clue + ', ' + move.number,
    name: currentState.agents[currentState.currentTeam].spymaster.model_name + ` (Spymaster)`,
    logo: currentState.agents[currentState.currentTeam].spymaster.logo,
    team: currentState.currentTeam,
    cards: currentState.cards,
  });
  newState.currentRole = 'operative';
  return newState;
}

// Make guesses and switch to spymaster role
export function updateGameStateFromOperativeMove(
  currentState: GameState,
  move: OperativeMove
): GameState {
  const newState = { ...currentState };
  newState.chatHistory.push({
    message: move.reasoning + '\n\n' + move.guesses.join(', '),
    name: currentState.agents[currentState.currentTeam].operative.model_name + ` (Operative)`,
    logo: currentState.agents[currentState.currentTeam].operative.logo,
    team: currentState.currentTeam,
    cards: currentState.cards,
  });

  for (const guess of move.guesses) {
    const card = newState.cards.find((card) => card.word.toUpperCase() === guess.toUpperCase());

    // If card not found or already revealed, it's an invalid guess
    if (!card || card.isRevealed) {
      console.error(`INVALID GUESS: ${guess}`);
      continue;
    }

    card.isRevealed = true;

    // Assassin card instantly loses the game
    if (card.color === 'black') {
      newState.gameWinner = currentState.currentTeam === 'red' ? 'blue' : 'red';
      return newState;
    }

    // Decrement the count of remaining cards for the team
    if (card.color === 'red') {
      newState.remainingRed--;
    } else if (card.color === 'blue') {
      newState.remainingBlue--;
    }

    // If no more cards remain for the team, they win
    if (newState.remainingRed === 0) {
      newState.gameWinner = 'red';
      return newState;
    } else if (newState.remainingBlue === 0) {
      newState.gameWinner = 'blue';
      return newState;
    }

    // If we guessed a card that isn't our team's color, we're done
    if (card.color !== currentState.currentTeam) {
      break;
    }
  }

  // Switch to the other team's spymaster once we're done guessing
  newState.currentRole = 'spymaster';
  newState.currentTeam = currentState.currentTeam === 'red' ? 'blue' : 'red';
  newState.currentClue = undefined;

  return newState;
}
