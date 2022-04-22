sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/Debuggable',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    Filter,
    FilterOperator,
    JSONModel,
    AppUtils,
    Debuggable,
    Client,
    ServiceNames
  ) => {
    'use strict';

    return Debuggable.extend('sap.ui.yesco.common.mobile.MobileEmployeeListPopoverHandler', {
      constructor: function (oController, sIconMode = 'Profile') {
        this.oController = oController;
        this.oPopoverModel = new JSONModel(this.getInitialData());
        this.oPopoverModel.setSizeLimit(10000);
        this.sIconMode = sIconMode; // Profile | Telephone

        this.init();
      },

      getInitialData() {
        return {
          popover: {
            busy: true,
            resizable: true,
            terms: null,
            employees: null,
          },
        };
      },

      async init() {
        const oView = this.oController.getView();

        this.oPopover = await Fragment.load({
          id: oView.getId(),
          name: 'sap.ui.yesco.fragment.mobile.MobileEmployeeListPopover',
          controller: this,
        });

        this.oPopover
          .attachAfterOpen(() => {
            setTimeout(() => {
              $('#sap-ui-blocklayer-popup')
                .off('click')
                .on('click', () => {
                  this.closePopover();
                });
            }, 100);
          })
          .attachBeforeClose(() => {
            setTimeout(() => {
              $('#sap-ui-blocklayer-popup').off('click');
            });
          })
          .attachAfterClose(() => {
            setTimeout(() => {
              this.onAfterClose();
            });
          })
          .setModel(this.oPopoverModel)
          .bindElement('/popover');

        oView.addDependent(this.oPopover);
      },

      onAfterClose() {
        this.oPopover.getContent()[1].getContent()[0].getBinding('items').filter([]);
        this.oPopoverModel.setProperty('/popover/terms', null);
        this.oPopoverModel.setProperty('/popover/employees', []);
      },

      togglePopover(oEvent) {
        if (this.oPopover.isOpen()) {
          this.closePopover();
        } else {
          this.oPopover.openBy(oEvent.getSource());
          this.setBusy(false);
        }
      },

      async openPopover(oParam) {
        try {
          setTimeout(() => {
            this.setBusy();
            this.oPopover.openBy(AppUtils.getAppController().byId('mobile-basis-home'));
          });

          let mPayload;
          if (oParam instanceof sap.ui.base.Event) {
            // Portlet 같은 곳에서 Headty, Discod 만 넘어오는 경우
            const oSessionModel = this.oController.getSessionModel();
            const oEventSourceData = oParam.getSource().data();
            mPayload = {
              Zyear: moment().year(),
              Werks: oSessionModel.getProperty('/Werks'),
              Orgeh: oSessionModel.getProperty('/Orgeh'),
              Headty: oEventSourceData.Headty,
              Discod: oEventSourceData.Discod,
            };
          } else {
            // MSS 인원현황 메뉴 같은 곳에서 oParam에 검색 조건이 모두 포함되어 넘어오는 경우
            mPayload = oParam;
          }

          const aEmployees = await Client.getEntitySet(this.oController.getModel(ServiceNames.PA), 'HeadCountDetail', mPayload);
          const sUnknownAvatarImageURL = AppUtils.getUnknownAvatarImageURL();

          this.oPopoverModel.setProperty(
            '/popover/employees',
            aEmployees.map(({ Photo, Ename, Pernr, Zzjikgbtx, Zzjikchtx, Orgtx }) => ({ Photo: Photo || sUnknownAvatarImageURL, Ename, Pernr, Zzjikcht: Zzjikgbtx, Zzjikgbt: Zzjikchtx, Fulln: Orgtx, IconMode: this.sIconMode }))
          );
        } catch (oError) {
          AppUtils.debug('MobileEmployeeListPopover > openPopover Error', oError);

          AppUtils.handleError(oError, {
            onClose: () => this.closePopover(),
          });
        } finally {
          this.setBusy(false);
        }
      },

      closePopover() {
        this.oPopover.close();
      },

      liveChange(oEvent) {
        const sValue = $.trim(oEvent.getParameter('newValue'));
        if (!sValue) {
          this.oPopover.getContent()[1].getContent()[0].getBinding('items').filter([]);
          return;
        }

        const aFilters = new Filter({
          filters: [
            new Filter('Ename', FilterOperator.Contains, sValue), //
            new Filter('Pernr', FilterOperator.Contains, sValue),
          ],
          and: false,
        });

        this.oPopover.getContent()[1].getContent()[0].getBinding('items').filter(aFilters);
      },

      navToProfile(oEvent) {
        if (this.sIconMode !== 'Profile') {
          return;
        }

        const oContext = oEvent.getSource().getBindingContext();
        // if (oContext.getProperty('') === 'M') {
        const sPernr = oContext.getProperty('Pernr');
        this.oController.getRouter().navTo('mobile/m/employee-detail', { pernr: sPernr });
        // }
      },

      setBusy(bBusy = true) {
        setTimeout(
          () => {
            this.oPopoverModel.setProperty('/popover/busy', bBusy);
          },
          bBusy ? 0 : 500
        );
        return this;
      },

      destroy() {
        this.oPopover.destroy();
        this.oPopoverModel.destroy();
      },
    });
  }
);
