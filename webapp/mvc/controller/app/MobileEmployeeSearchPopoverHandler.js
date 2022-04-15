sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/Debuggable',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/model/type/Date', // XML expression binding용 type preloading
    'sap/ui/yesco/mvc/model/type/Time',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    JSONModel,
    Debuggable,
    Client,
    ServiceNames
  ) => {
    'use strict';

    return Debuggable.extend('sap.ui.yesco.mvc.controller.app.MobileEmployeeSearchPopoverHandler', {
      /**
       * @override
       */
      constructor: function (oController) {
        this.oController = oController;
        this.oPopoverModel = new JSONModel(this.getInitialData());
        this.oPopoverModel.setSizeLimit(10000);

        this.init();
      },

      getInitialData() {
        return {
          busy: true,
          linkType: this.oController.isMss() ? 'M' : '',
          employees: null,
        };
      },

      async init() {
        const oView = this.oController.getView();

        this.oPopover = await Fragment.load({
          id: oView.getId(),
          name: 'sap.ui.yesco.mvc.view.app.fragment.MobileEmployeeSearchPopover',
          controller: this,
        });

        this.oPopover
          .attachAfterOpen(() => {
            setTimeout(() => {
              $('#sap-ui-blocklayer-popup')
                .off('click')
                .on('click', () => {
                  this.onPopoverClose();
                });
            }, 100);
          })
          .attachBeforeClose(() => {
            setTimeout(() => {
              $('#sap-ui-blocklayer-popup').off('click');
            });
          })
          .setModel(this.oPopoverModel)
          .bindElement('/');

        oView.addDependent(this.oPopover);

        this.setBusy(false);
      },

      async showSuggestionData(sValue) {
        this.setBusy(true);
        const aEmployees = await this.readSuggestionData(sValue);

        this.oPopoverModel.setProperty('/employees', aEmployees);
        this.setBusy(false);
      },

      async readSuggestionData(sValue) {
        const oModel = this.oController.getModel(ServiceNames.COMMON);
        const mFilters = {
          Ename: sValue,
          Stat2: '3',
          Accty: 'Z',
        };

        return Client.getEntitySet(oModel, 'EmpSearchResult', mFilters);
      },

      onLiveChange(oEvent) {
        if (this.liveChangeInterval) {
          clearInterval(this.liveChangeInterval);
        }

        const sValue = $.trim(oEvent.getParameter('newValue'));
        if (!sValue || sValue.length < 2) {
          this.oPopoverModel.setProperty('/employees', []);
          return;
        }

        this.liveChangeInterval = setInterval(() => {
          clearInterval(this.liveChangeInterval);
          this.showSuggestionData(sValue);
        }, 500);
      },

      onPopoverToggle(oEvent) {
        if (this.oPopover.isOpen()) {
          this.onPopoverClose();
        } else {
          this.oPopover.openBy(oEvent.getSource());
          this.setBusy(false);
        }
      },

      onPopoverClose() {
        this.oPopover.close();
      },

      navToProfile(oEvent) {
        const sLinkType = this.oPopoverModel.getProperty('/linkType');
        if (sLinkType !== 'M') {
          return;
        }

        const sPernr = oEvent.getSource().getBindingContext().getProperty('Pernr');
        this.oController.reduceViewResource().getRouter().navTo('mobile/m/employee-detail', { pernr: sPernr });
      },

      setBusy(bBusy = true) {
        setTimeout(
          () => {
            this.oPopoverModel.setProperty('/busy', bBusy);
          },
          bBusy ? 0 : 500
        );
        return this;
      },
    });
  }
);
