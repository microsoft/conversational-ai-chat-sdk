import { Fragment, memo, useCallback, useState } from 'react';
import { useRefFrom } from 'use-ref-from';

import { type PropsOf } from '../types/PropsOf';
import CredentialForm from './CredentialForm';
import useAppReducer from '../data/useAppReducer';
import WebChat from './WebChat';

type SubmittedCredential = {
  botIdentifier: string;
  environmentID: string;
  hostnameSuffix: string;
  key: number;
  tenantID?: string;
  token: string;
};

type CredentialFormChangeCallback = Exclude<PropsOf<typeof CredentialForm>['onChange'], undefined>;

export default memo(function App() {
  const [
    { botIdentifier, environmentID, hostnameSuffix, token },
    { reset, saveToSessionStorage, setBotIdentifier, setEnvironmentID, setHostnameSuffix, setToken }
  ] = useAppReducer();
  const [submittedCredential, setSubmittedCredential] = useState<SubmittedCredential | undefined>();
  const botIdentifierRef = useRefFrom(botIdentifier);
  const environmentIDRef = useRefFrom(environmentID);
  const hostnameSuffixRef = useRefFrom(hostnameSuffix);
  const tokenRef = useRefFrom(token);

  const handleCredentialFormChange = useCallback<CredentialFormChangeCallback>(
    ({ botIdentifier, environmentID, hostnameSuffix, token }) => {
      setBotIdentifier(botIdentifier);
      setEnvironmentID(environmentID);
      setHostnameSuffix(hostnameSuffix);
      setToken(token);

      saveToSessionStorage();
    },
    [saveToSessionStorage, setBotIdentifier, setEnvironmentID, setHostnameSuffix, setToken]
  );

  const handleReset = useCallback(() => reset(), [reset]);

  const handleSubmit = useCallback(
    () =>
      setSubmittedCredential({
        botIdentifier: botIdentifierRef.current,
        environmentID: environmentIDRef.current,
        hostnameSuffix: hostnameSuffixRef.current,
        key: Date.now(),
        token: tokenRef.current
      }),
    [botIdentifierRef, environmentIDRef, hostnameSuffixRef, setSubmittedCredential, tokenRef]
  );

  return (
    <Fragment>
      <h1>Power Virtual Agents chat adapter demo</h1>
      <h2>Credential</h2>
      <CredentialForm
        autoFocus={!!(botIdentifier && environmentID && token)}
        botIdentifier={botIdentifier}
        environmentID={environmentID}
        hostnameSuffix={hostnameSuffix}
        token={token}
        onChange={handleCredentialFormChange}
        onReset={handleReset}
        onSubmit={handleSubmit}
      />
      {!!submittedCredential && (
        <WebChat
          botIdentifier={submittedCredential.botIdentifier}
          environmentID={submittedCredential.environmentID}
          hostnameSuffix={submittedCredential.hostnameSuffix}
          key={submittedCredential.key}
          token={submittedCredential.token}
        />
      )}
    </Fragment>
  );
});
