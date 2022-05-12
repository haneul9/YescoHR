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

    return Debuggable.extend('sap.ui.yesco.common.mobile.MobileEmployeeListPopoverHandler2', {
      constructor: function (oEmployeeListProvider) {
        this.oEmployeeListProvider = oEmployeeListProvider;

        this.init();
      },

      async init() {
        this.oPopoverModel = oEmployeeListProvider.getModel();

        const onAfterClose = this.oEmployeeListProvider.onAfterClose;
        if (onAfterClose && typeof onAfterClose === 'function') {
          this.onAfterClose = onAfterClose;
        }

        const oView = this.oEmployeeListProvider.getView();

        this.oPopover = await Fragment.load({
          id: oView.getId(),
          name: this.oEmployeeListProvider.getPopoverXML(),
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
            this.onAfterClose();
          })
          .setModel(this.oPopoverModel)
          .bindElement('/popover');

        oView.addDependent(this.oPopover);
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

          this.oEmployeeListProvider.retrieve();
        } catch (oError) {
          AppUtils.debug('MobileEmployeeListPopoverHandler > openPopover Error', oError);

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

        if (!this.bHasProfileMenuAuth) {
          return;
        }

        const sPernr = oEvent.getSource().getBindingContext().getProperty('Pernr');
        AppUtils.getAppController().getAppMenu().moveToMenu(this.sProfileMenuUrl, { pernr: sPernr });
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
