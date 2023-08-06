import { Fragment, memo, useCallback, useEffect, useMemo } from 'react';
import { fromTurnBasedChatAdapterAPI, PowerPlatformAPIChatAdapter, PrebuiltBotAPIStrategy } from 'powerva-chat-adapter';

import ReactWebChat from 'botframework-webchat';

type Props = {
  botIdentifier: string;
  environmentID: string;
  hostnameSuffix: string;
  tenantID?: string;
  token: string;
};

export default memo(function WebChat({ botIdentifier, environmentID, hostnameSuffix, tenantID, token }: Props) {
  // Should use PowerPlatformApiDiscovery to find out the base URL.
  const environmentIDWithoutHyphens = useMemo(() => environmentID.replaceAll('-', ''), [environmentID]);
  const getToken = useCallback<() => Promise<string>>(() => Promise.resolve(token), [token]);
  const hostnameShardLength = useMemo(() => (hostnameSuffix === 'api.powerplatform.com' ? 2 : 1), [hostnameSuffix]);

  const hostnamePrefix = useMemo(
    () =>
      [
        environmentIDWithoutHyphens.substring(0, environmentIDWithoutHyphens.length - hostnameShardLength),
        environmentIDWithoutHyphens.substring(environmentIDWithoutHyphens.length - hostnameShardLength)
      ].join('.'),
    [environmentIDWithoutHyphens, hostnameShardLength]
  );

  const environmentEndpointURL = new URL(`https://${hostnamePrefix}.environment.${hostnameSuffix}`);

  const strategy = useMemo(
    () => new PrebuiltBotAPIStrategy(environmentEndpointURL, tenantID, environmentID, botIdentifier, getToken),
    [botIdentifier, environmentEndpointURL, environmentID, getToken, tenantID]
  );

  const chatAdapter = useMemo(() => fromTurnBasedChatAdapterAPI(new PowerPlatformAPIChatAdapter(strategy)), [strategy]);

  useEffect(() => () => chatAdapter?.end(), [chatAdapter]);

  return (
    <Fragment>
      <pre>{JSON.stringify({ botIdentifier, environmentID, hostnameSuffix, tenantID }, null, 2)}</pre>
      <div className="webchat">
        <ReactWebChat directLine={chatAdapter} />
      </div>
    </Fragment>
  );
});
