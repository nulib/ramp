import React from 'react';

const PlayerStateContext = React.createContext();
const PlayerDispatchContext = React.createContext();

function PlayerReducer(state = {}, action) {
  switch (action.type) {
    case 'updatePlayer': {
      return { ...state, player: action.player };
    }
    case 'seekPlayer': {
      return {
        ...state,
        clickedUrl: action.clickedUrl,
        clicked: true,
      };
    }
    case 'resetClick': {
      return { ...state, clicked: false };
    }
    case 'setStartTime': {
      return { ...state, startTime: action.startTime };
    }
    case 'setPlayingStatus': {
      return { ...state, isPlaying: action.isPlaying };
    }
    case 'setCaptionStatus': {
      return { ...state, captionOn: action.captionOn };
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`);
    }
  }
}

function PlayerProvider({ children }) {
  const [state, dispatch] = React.useReducer(PlayerReducer, {});
  return (
    <PlayerStateContext.Provider value={state}>
      <PlayerDispatchContext.Provider value={dispatch}>
        {children}
      </PlayerDispatchContext.Provider>
    </PlayerStateContext.Provider>
  );
}

function usePlayerState() {
  const context = React.useContext(PlayerStateContext);
  if (context === undefined) {
    throw new Error(`usePlayerState must be used within the PlayerProvider`);
  }
  return context;
}

function usePlayerDispatch() {
  const context = React.useContext(PlayerDispatchContext);
  if (context === undefined) {
    throw new Error(`usePlayerDispatch must be used within the PlayerProvider`);
  }
  return context;
}

export { PlayerProvider, usePlayerState, usePlayerDispatch };
