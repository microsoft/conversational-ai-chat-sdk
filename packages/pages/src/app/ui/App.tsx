import { Fragment, useCallback } from 'react';

import CredentialForm from './CredentialForm';
import useAppReducer from '../data/useAppReducer';
import { PropsOf } from '../types/PropsOf';

type CredentialFormChangeCallback = Exclude<PropsOf<typeof CredentialForm>['onChange'], undefined>;

const App = () => {
  const [{ botIdentifier, environmentID, tenantID }, { setBotIdentifier, setEnvironmentID, setTenantID }] =
    useAppReducer();

  const handleCredentialFormChange = useCallback<CredentialFormChangeCallback>(
    ({ botIdentifier, environmentID, tenantID }) => {
      setBotIdentifier(botIdentifier);
      setEnvironmentID(environmentID);
      setTenantID(tenantID);
    },
    [setBotIdentifier, setEnvironmentID, setTenantID]
  );

  return (
    <Fragment>
      <CredentialForm
        botIdentifier={botIdentifier}
        environmentID={environmentID}
        tenantID={tenantID}
        onChange={handleCredentialFormChange}
      />
    </Fragment>
  );
};

export default App;
