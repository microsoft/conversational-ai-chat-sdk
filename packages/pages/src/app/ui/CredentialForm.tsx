import { type ChangeEventHandler, useCallback } from 'react';
import { useRefFrom } from 'use-ref-from';

type Props = {
  botIdentifier?: string;
  environmentID?: string;
  onChange?: (nextCredential: { botIdentifier: string; environmentID: string; tenantID: string }) => void;
  onSubmit?: () => void;
  tenantID?: string;
};

const CredentialForm = ({ botIdentifier, environmentID, onChange, onSubmit, tenantID }: Props) => {
  const botIdentifierRef = useRefFrom(botIdentifier);
  const environmentIDRef = useRefFrom(environmentID);
  const onChangeRef = useRefFrom(onChange);
  const onSubmitRef = useRefFrom(onSubmit);
  const tenantIDRef = useRefFrom(tenantID);

  const handleBotIdentifierChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    ({ currentTarget }) => {
      onChangeRef.current?.({
        botIdentifier: currentTarget.value,
        environmentID: environmentIDRef.current || '',
        tenantID: tenantIDRef.current || ''
      });
    },
    [environmentIDRef, onChangeRef, tenantIDRef]
  );

  const handleEnvironmentIDChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    ({ currentTarget }) => {
      onChangeRef.current?.({
        botIdentifier: botIdentifierRef.current || '',
        environmentID: currentTarget.value,
        tenantID: tenantIDRef.current || ''
      });
    },
    [botIdentifierRef, onChangeRef, tenantIDRef]
  );

  const handleTenantIDChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    ({ currentTarget }) => {
      onChangeRef.current?.({
        botIdentifier: botIdentifierRef.current || '',
        environmentID: environmentIDRef.current || '',
        tenantID: currentTarget.value
      });
    },
    [botIdentifierRef, onChangeRef, environmentIDRef]
  );

  const handleSubmit = useCallback<ChangeEventHandler<HTMLFormElement>>(
    event => {
      event.preventDefault();

      onSubmitRef.current?.();
    },
    [onSubmitRef]
  );

  return (
    <form onSubmit={handleSubmit}>
      <dl>
        <label>
          <dt>Tenant ID</dt>
          <dd>
            <input onChange={handleTenantIDChange} required type="text" value={tenantID || ''} />
          </dd>
        </label>
        <label>
          <dt>Environment ID</dt>
          <dd>
            <input onChange={handleEnvironmentIDChange} required type="text" value={environmentID || ''} />
          </dd>
        </label>
        <label>
          <dt>Bot identifier</dt>
          <dd>
            <input onChange={handleBotIdentifierChange} required type="text" value={botIdentifier || ''} />
          </dd>
        </label>
      </dl>
      <button type="submit">Create</button>
    </form>
  );
};

export default CredentialForm;
