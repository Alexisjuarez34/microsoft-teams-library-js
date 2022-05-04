import { teams } from '../../src/private';
import { app } from '../../src/public';
import { errorNotSupportedOnPlatform, FrameContexts } from '../../src/public/constants';
import { _minRuntimeConfigToUninitialize } from '../../src/public/runtime';
import { Utils } from '../utils';

describe('Testing teams capabillity', () => {
  describe('FRAMED - teams capability tests', () => {
    // Use to send a mock message from the app.
    const utils = new Utils();
    const emptyCallback = () => {};

    beforeEach(() => {
      utils.processMessage = null;
      utils.messages = [];
      utils.childMessages = [];
      utils.childWindow.closed = false;
      utils.mockWindow.parent = utils.parentWindow;

      // Set a mock window for testing
      app._initialize(utils.mockWindow);
    });

    afterEach(() => {
      // Reset the object since it's a singleton
      if (app._uninitialize) {
        utils.setRuntimeConfig(_minRuntimeConfigToUninitialize);
        app._uninitialize();
      }
    });

    describe('Testing teams.getTeamChannels function', () => {
      const allowedContexts = [FrameContexts.content];
      it('should not allow calls before initialization', () => {
        expect(() => teams.getTeamChannels('groupId', emptyCallback)).toThrowError(
          'The library has not yet been initialized',
        );
      });

      Object.values(FrameContexts).forEach(context => {
        if (allowedContexts.some(allowedContexts => allowedContexts === context)) {
          it(`teams.getTeamChannels should throw error when teams is not supported. context: ${context}`, async () => {
            await utils.initializeWithContext(context);
            utils.setRuntimeConfig({ apiVersion: 1, supports: {} });
            expect.assertions(1);
            try {
              teams.getTeamChannels('groupId', emptyCallback);
            } catch (e) {
              expect(e).toEqual(errorNotSupportedOnPlatform);
            }
          });

          it(`teams.getTeamChannels should not allow calls with null groupId. context: ${context}`, async () => {
            await utils.initializeWithContext(context);
            expect(() => teams.getTeamChannels(null, emptyCallback)).toThrowError();
          });

          it(`teams.getTeamChannels should not allow calls with empty groupId. context: ${context}`, async () => {
            await utils.initializeWithContext(context);
            expect(() => teams.getTeamChannels('', emptyCallback)).toThrowError();
          });

          it(`teams.getTeamChannels should not allow calls with empty callback. context: ${context}`, async () => {
            await utils.initializeWithContext(context);
            expect(() => teams.getTeamChannels('groupId', null)).toThrowError();
          });

          it(`teams.getTeamChannels should trigger callback correctly. context: ${context}`, async () => {
            await utils.initializeWithContext(context);
            const mockTeamsChannels: teams.ChannelInfo[] = [
              {
                siteUrl: 'https://microsoft.sharepoint.com/teams/teamsName',
                objectId: 'someId',
                folderRelativeUrl: '/teams/teamsName/Shared Documents/General',
                displayName: 'General',
                channelType: teams.ChannelType.Regular,
              },
            ];

            const callback = jest.fn((err, folders) => {
              expect(err).toBeFalsy();
              expect(folders).toEqual(mockTeamsChannels);
            });

            teams.getTeamChannels('groupId', callback);

            const getCloudStorageFoldersMessage = utils.findMessageByFunc('teams.getTeamChannels');
            expect(getCloudStorageFoldersMessage).not.toBeNull();
            utils.respondToMessage(getCloudStorageFoldersMessage, false, mockTeamsChannels);
            expect(callback).toHaveBeenCalled();
          });
        } else {
          it(`teams.getTeamChannels should not allow calls without frame context initialization. context: ${context}`, async () => {
            await utils.initializeWithContext(context);
            expect(() => teams.getTeamChannels('groupId', emptyCallback)).toThrowError(
              `This call is only allowed in following contexts: ${JSON.stringify(
                allowedContexts,
              )}. Current context: "${context}".`,
            );
          });
        }
      });
    });

    describe('Testing teams.refreshSiteUrl function', () => {
      it('teams.refreshSiteUrl should not allow calls before initialization', () => {
        expect(() => teams.refreshSiteUrl('threadId', emptyCallback)).toThrowError(
          'The library has not yet been initialized',
        );
      });

      Object.values(FrameContexts).forEach(context => {
        it(`teams.refreshSiteUrl should throw error when teams is not supported. context: ${context}`, async () => {
          await utils.initializeWithContext(context);
          utils.setRuntimeConfig({ apiVersion: 1, supports: {} });
          expect.assertions(1);
          try {
            teams.refreshSiteUrl('threadId', emptyCallback);
          } catch (e) {
            expect(e).toEqual(errorNotSupportedOnPlatform);
          }
        });

        it(`teams.refreshSiteUrl should throw error when threadId is null. context: ${context}`, async () => {
          await utils.initializeWithContext(context);
          expect(() => teams.refreshSiteUrl('', emptyCallback)).toThrowError(
            '[teams.refreshSiteUrl] threadId cannot be null or empty',
          );
        });

        it(`teams.refreshSiteUrl should throw error when threadId is null. context: ${context}`, async () => {
          await utils.initializeWithContext(context);
          expect(() => teams.refreshSiteUrl('threadId', null)).toThrowError(
            '[teams.refreshSiteUrl] Callback cannot be null',
          );
        });

        it(`teams.refreshSiteUrl should trigger callback correctly. context: ${context}`, async () => {
          await utils.initializeWithContext(context);
          const callback = jest.fn(err => {
            expect(err).toBeFalsy();
          });

          teams.refreshSiteUrl('threadId', callback);

          const getCloudStorageFoldersMessage = utils.findMessageByFunc('teams.refreshSiteUrl');
          expect(getCloudStorageFoldersMessage).not.toBeNull();
          utils.respondToMessage(getCloudStorageFoldersMessage, false, 'Some Message');
          expect(callback).toHaveBeenCalled();
        });
      });
    });

    describe('Testing teams.isSupported function', () => {
      it('teams.isSupported should return false if the runtime says teams is not supported', () => {
        utils.setRuntimeConfig({ apiVersion: 1, supports: {} });
        expect(teams.isSupported()).not.toBeTruthy();
      });
      it('teams.isSupported should return true if the runtime says teams is supported', () => {
        utils.setRuntimeConfig({ apiVersion: 1, supports: { teams: {} } });
        expect(teams.isSupported()).toBeTruthy();
      });
    });
  });
});