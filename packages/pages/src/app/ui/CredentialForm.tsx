import { type ChangeEventHandler, useCallback } from 'react';
import { useRefFrom } from 'use-ref-from';
import DoubleTapButton from './DoubleTapButton';

type Props = {
  autoFocus?: boolean;
  botIdentifier?: string;
  environmentID?: string;
  onChange?: (nextCredential: {
    botIdentifier: string;
    environmentID: string;
    tenantID: string;
    token: string;
  }) => void;
  onSubmit?: () => void;
  tenantID?: string;
  token?: string;
};

const CredentialForm = ({ autoFocus, botIdentifier, environmentID, onChange, onSubmit, tenantID, token }: Props) => {
  const botIdentifierRef = useRefFrom(botIdentifier);
  const environmentIDRef = useRefFrom(environmentID);
  const onChangeRef = useRefFrom(onChange);
  const onSubmitRef = useRefFrom(onSubmit);
  const tenantIDRef = useRefFrom(tenantID);
  const tokenRef = useRefFrom(token);

  const dispatchChange = useCallback(
    (overrides: { botIdentifier?: string; environmentID?: string; tenantID?: string; token?: string }) =>
      onChangeRef.current?.({
        botIdentifier: botIdentifierRef.current || '',
        environmentID: environmentIDRef.current || '',
        tenantID: tenantIDRef.current || '',
        token: tokenRef.current || '',
        ...overrides
      }),
    [botIdentifierRef, environmentIDRef, tenantIDRef, tokenRef]
  );

  const handleBotIdentifierChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    ({ currentTarget }) => dispatchChange({ botIdentifier: currentTarget.value }),
    [environmentIDRef, onChangeRef, tenantIDRef, tokenRef]
  );

  const handleEnvironmentIDChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    ({ currentTarget }) => dispatchChange({ environmentID: currentTarget.value }),
    [dispatchChange]
  );

  const handleTenantIDChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    ({ currentTarget }) => dispatchChange({ tenantID: currentTarget.value }),
    [botIdentifierRef, onChangeRef, environmentIDRef]
  );

  const handleTokenChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    ({ currentTarget }) => dispatchChange({ token: currentTarget.value }),
    [botIdentifierRef, onChangeRef, environmentIDRef]
  );

  const handleSubmit = useCallback<ChangeEventHandler<HTMLFormElement>>(
    event => {
      event.preventDefault();

      onSubmitRef.current?.();
    },
    [onSubmitRef]
  );

  const handleResetButtonClick = useCallback(
    () => dispatchChange({ botIdentifier: '', environmentID: '', tenantID: '', token: '' }),
    [dispatchChange]
  );

  // TODO: If autofocus is enabled, consider focus on the first invalid field.

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
        <label>
          <dt>Token</dt>
          <dd>
            <input autoComplete="off" onChange={handleTokenChange} required type="password" value={token || ''} />
          </dd>
        </label>
      </dl>
      <button autoFocus={autoFocus} type="submit">
        Create
      </button>{' '}
      <DoubleTapButton onClick={handleResetButtonClick}>Double tap to reset</DoubleTapButton>
    </form>
  );
};

export default CredentialForm;
