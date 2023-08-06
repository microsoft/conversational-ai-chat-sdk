import { Fragment, useCallback, useState } from 'react';
import { useRefFrom } from 'use-ref-from';

import { type PropsOf } from '../types/PropsOf';
import CredentialForm from './CredentialForm';
import useAppReducer from '../data/useAppReducer';

type CredentialFormChangeCallback = Exclude<PropsOf<typeof CredentialForm>['onChange'], undefined>;

type Credential = {
  botIdentifier: string;
  environmentID: string;
  tenantID: string;
  token: string;
};

const App = () => {
  const [
    { botIdentifier, environmentID, tenantID, token },
    { saveToSessionStorage, setBotIdentifier, setEnvironmentID, setTenantID, setToken }
  ] = useAppReducer();
  const botIdentifierRef = useRefFrom(botIdentifier);
  const environmentIDRef = useRefFrom(environmentID);
  const tenantIDRef = useRefFrom(tenantID);
  const tokenRef = useRefFrom(token);
  const [submitted, setSubmitted] = useState<Credential | undefined>();

  const handleCredentialFormChange = useCallback<CredentialFormChangeCallback>(
    ({ botIdentifier, environmentID, tenantID, token }) => {
      setBotIdentifier(botIdentifier);
      setEnvironmentID(environmentID);
      setTenantID(tenantID);
      setToken(token);
      saveToSessionStorage();
    },
    [saveToSessionStorage, setBotIdentifier, setEnvironmentID, setTenantID, setToken]
  );

  const handleSubmit = useCallback(
    () =>
      setSubmitted({
        botIdentifier: botIdentifierRef.current,
        environmentID: environmentIDRef.current,
        tenantID: tenantIDRef.current,
        token: tokenRef.current
      }),
    [botIdentifierRef, environmentIDRef, setSubmitted, tenantIDRef, tokenRef]
  );

  return (
    <Fragment>
      <CredentialForm
        autoFocus={!!(botIdentifier && environmentID && tenantID && token)}
        botIdentifier={botIdentifier}
        environmentID={environmentID}
        tenantID={tenantID}
        token={token}
        onChange={handleCredentialFormChange}
        onSubmit={handleSubmit}
      />
      {!!submitted && (
        <div>
          <pre>{JSON.stringify({ ...submitted, token: undefined }, null, 2)}</pre>
        </div>
      )}
    </Fragment>
  );
};

export default App;
