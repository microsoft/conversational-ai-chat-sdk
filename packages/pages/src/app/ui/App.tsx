import { Fragment, useCallback } from 'react';

import { type PropsOf } from '../types/PropsOf';
import CredentialForm from './CredentialForm';
import useAppReducer from '../data/useAppReducer';

type CredentialFormChangeCallback = Exclude<PropsOf<typeof CredentialForm>['onChange'], undefined>;

const App = () => {
  const [
    { botIdentifier, environmentID, tenantID, token },
    { saveToSessionStorage, setBotIdentifier, setEnvironmentID, setTenantID, setToken }
  ] = useAppReducer();

  const handleCredentialFormChange = useCallback<CredentialFormChangeCallback>(
    ({ botIdentifier, environmentID, tenantID, token }) => {
      setBotIdentifier(botIdentifier);
      setEnvironmentID(environmentID);
      setTenantID(tenantID);
      setToken(token);
    },
    [setBotIdentifier, setEnvironmentID, setTenantID, setToken]
  );

  const handleSubmit = useCallback(() => saveToSessionStorage(), [saveToSessionStorage]);

  return (
    <Fragment>
      <CredentialForm
        botIdentifier={botIdentifier}
        environmentID={environmentID}
        tenantID={tenantID}
        token={token}
        onChange={handleCredentialFormChange}
        onSubmit={handleSubmit}
      />
    </Fragment>
  );
};

export default App;
