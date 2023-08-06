import { useCallback, useMemo, useReducer } from 'react';

type State = {
  botIdentifier: string;
  environmentID: string;
  tenantID: string;
};

type SetBotIdentifierAction = {
  payload: string;
  type: 'SET_BOT_IDENTIFIER';
};

type SetEnvironmentIDAction = {
  payload: string;
  type: 'SET_ENVIRONMENT_ID';
};

type SetTenantIDAction = {
  payload: string;
  type: 'SET_TENANT_ID';
};

type Action = SetBotIdentifierAction | SetEnvironmentIDAction | SetTenantIDAction;

type DispatchAction = {
  setBotIdentifier: (botIdentifier: string) => void;
  setEnvironmentID: (environmentID: string) => void;
  setTenantID: (tenantID: string) => void;
};

export default function useAppReducer(): readonly [State, Readonly<DispatchAction>] {
  const reducer = useCallback((state: State, action: Action) => {
    if (action.type === 'SET_BOT_IDENTIFIER') {
      state = { ...state, botIdentifier: action.payload };
    } else if (action.type === 'SET_ENVIRONMENT_ID') {
      state = { ...state, environmentID: action.payload };
    } else if (action.type === 'SET_TENANT_ID') {
      state = { ...state, tenantID: action.payload };
    }

    return state;
  }, []);

  const [state, dispatch] = useReducer(reducer, {
    botIdentifier: '',
    environmentID: '',
    tenantID: ''
  });

  const setBotIdentifier = useCallback(
    (botIdentifier: string) => dispatch({ payload: botIdentifier, type: 'SET_BOT_IDENTIFIER' }),
    [dispatch]
  );

  const setEnvironmentID = useCallback(
    (environmentID: string) => dispatch({ payload: environmentID, type: 'SET_ENVIRONMENT_ID' }),
    [dispatch]
  );

  const setTenantID = useCallback(
    (tenantID: string) => dispatch({ payload: tenantID, type: 'SET_TENANT_ID' }),
    [dispatch]
  );

  const dispatchActions = useMemo(
    () =>
      Object.freeze({
        setBotIdentifier,
        setEnvironmentID,
        setTenantID
      }),
    [setBotIdentifier, setEnvironmentID, setTenantID]
  );

  return Object.freeze([state, dispatchActions]);
}
