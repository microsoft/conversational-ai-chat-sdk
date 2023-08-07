import { useCallback, useMemo, useReducer } from 'react';
import onErrorResumeNext from '../util/onErrorResumeNext';

type State = {
  botIdentifier: string;
  environmentID: string;
  hostnameSuffix: string;
  tenantID?: string;
  token: string;
};

type ResetAction = { type: 'RESET' };
type SaveToSessionStorageAction = { type: 'SAVE_TO_SESSION_STORAGE' };
type SetBotIdentifierAction = { payload: string; type: 'SET_BOT_IDENTIFIER' };
type SetEnvironmentIDAction = { payload: string; type: 'SET_ENVIRONMENT_ID' };
type SetHostnameSuffixAction = { payload: string; type: 'SET_HOSTNAME_SUFFIX' };
type SetTokenAction = { payload: string; type: 'SET_TOKEN' };

type Action =
  | ResetAction
  | SaveToSessionStorageAction
  | SetBotIdentifierAction
  | SetEnvironmentIDAction
  | SetHostnameSuffixAction
  | SetTokenAction;

type DispatchAction = {
  reset: () => void;
  saveToSessionStorage: () => void;
  setBotIdentifier: (botIdentifier: string) => void;
  setEnvironmentID: (environmentID: string) => void;
  setHostnameSuffix: (hostnameSuffix: string) => void;
  setToken: (token: string) => void;
};

const DEFAULT_STATE: State = {
  botIdentifier: '',
  environmentID: '',
  hostnameSuffix: 'api.powerplatform.com',
  token: ''
};

export default function useAppReducer(): readonly [State, Readonly<DispatchAction>] {
  const reducer = useCallback((state: State, action: Action) => {
    if (action.type === 'RESET') {
      state = DEFAULT_STATE;
    } else if (action.type === 'SAVE_TO_SESSION_STORAGE') {
      onErrorResumeNext(() => sessionStorage?.setItem('app:state', JSON.stringify(state)));
    } else if (action.type === 'SET_BOT_IDENTIFIER') {
      if (state.botIdentifier !== action.payload) {
        state = { ...state, botIdentifier: action.payload };
      }
    } else if (action.type === 'SET_ENVIRONMENT_ID') {
      if (state.environmentID !== action.payload) {
        state = { ...state, environmentID: action.payload };
      }
    } else if (action.type === 'SET_HOSTNAME_SUFFIX') {
      if (state.hostnameSuffix !== action.payload) {
        state = { ...state, hostnameSuffix: action.payload };
      }
    } else if (action.type === 'SET_TOKEN') {
      if (state.token !== action.payload) {
        state = { ...state, token: action.payload };
      }
    }

    return state;
  }, []);

  const [state, dispatch] = useReducer(reducer, {
    ...DEFAULT_STATE,
    ...onErrorResumeNext(() => JSON.parse(sessionStorage?.getItem('app:state') || '{}'), {})
  });

  const reset = useCallback(() => dispatch({ type: 'RESET' }), [dispatch]);

  const saveToSessionStorage = useCallback(() => dispatch({ type: 'SAVE_TO_SESSION_STORAGE' }), [dispatch]);

  const setBotIdentifier = useCallback(
    (botIdentifier: string) => dispatch({ payload: botIdentifier, type: 'SET_BOT_IDENTIFIER' }),
    [dispatch]
  );

  const setEnvironmentID = useCallback(
    (environmentID: string) => dispatch({ payload: environmentID, type: 'SET_ENVIRONMENT_ID' }),
    [dispatch]
  );

  const setHostnameSuffix = useCallback(
    (hostnameSuffix: string) => dispatch({ payload: hostnameSuffix, type: 'SET_HOSTNAME_SUFFIX' }),
    [dispatch]
  );

  const setToken = useCallback((token: string) => dispatch({ payload: token, type: 'SET_TOKEN' }), [dispatch]);

  const dispatchActions = useMemo(
    () =>
      Object.freeze({
        reset,
        saveToSessionStorage,
        setBotIdentifier,
        setEnvironmentID,
        setHostnameSuffix,
        setToken
      }),
    [setBotIdentifier, setEnvironmentID, setHostnameSuffix, setToken]
  );

  return Object.freeze([state, dispatchActions]);
}
