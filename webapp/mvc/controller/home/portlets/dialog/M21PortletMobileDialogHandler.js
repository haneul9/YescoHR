sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
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
    AppUtils,
    Debuggable,
    Client,
    ServiceNames
  ) => {
    'use strict';

    /**
     * 인원 현황 Portlet (임원용) Mobile Dialog Handler
     */
    return Debuggable.extend('sap.ui.yesco.mvc.controller.home.portlets.dialog.M21PortletMobileDialogHandler', {
      /**
       * @override
       */
      constructor: function (oController, oPortletModel) {
        this.oController = oController;
        this.oPortletModel = oPortletModel;

        this.init();
      },

      async init() {
        const oView = this.oController.getView();

        this.oDialog = await Fragment.load({
          id: oView.getId(),
          name: 'sap.ui.yesco.mvc.view.app.fragment.MobileEmployeeSearchDialog',
          controller: this,
        });

        this.oPortletModel.setProperty('/dialog', { busy: true, linkType: 'M', employees: null });

        this.oDialog
          .attachAfterOpen(() => {
            setTimeout(() => {
              $('#sap-ui-blocklayer-popup')
                .off('click')
                .on('click', () => {
                  this.onPressDetailDialogClose();
                });
            }, 100);
          })
          .attachBeforeClose(() => {
            setTimeout(() => {
              $('#sap-ui-blocklayer-popup').off('click');
            });
          })
          .setModel(this.oPortletModel)
          .bindElement('/dialog');

        oView.addDependent(this.oDialog);
      },

      onLiveChange(oEvent) {
        const sValue = $.trim(oEvent.getParameter('newValue'));
        if (!sValue) {
          this.oDialog.getContent()[1].getContent()[0].getBinding('items').filter([]);
          return;
        }

        const aFilters = new Filter({
          filters: [
            new Filter('Ename', FilterOperator.Contains, sValue), //
            new Filter('Pernr', FilterOperator.Contains, sValue),
          ],
          and: false,
        });

        this.oDialog.getContent()[1].getContent()[0].getBinding('items').filter(aFilters);
      },

      async openDialog(oEvent) {
        this.oPortletModel.setProperty('/dialog/busy', true);

        try {
          const oEventSource = oEvent.getSource();
          const oSessionModel = this.oController.getSessionModel();
          const mPayload = {
            Zyear: moment().year(),
            Werks: oSessionModel.getProperty('/Werks'),
            Orgeh: oSessionModel.getProperty('/Orgeh'),
            Headty: 'A',
            Discod: oEventSource.data('Discod'),
          };
          const aDetailData = await Client.getEntitySet(this.oController.getModel(ServiceNames.PA), 'HeadCountDetail', mPayload);

          this.oPortletModel.setProperty(
            '/dialog/employees',
            aDetailData.map(({ Photo, Ename, Pernr, Zzjikgbtx, Zzjikchtx, Orgtx }) => ({ Photo, Ename, Pernr, Zzjikcht: Zzjikgbtx, Zzjikgbt: Zzjikchtx, Fulln: Orgtx, linkType: 'M' }))
          );

          this.oDialog.openBy(oEventSource);
        } catch (oError) {
          this.oController.debug('M21PortletMobileDialogHandler > openDialog Error', oError);

          AppUtils.handleError(oError, {
            onClose: () => this.oDialog.close(),
          });
        } finally {
          this.oPortletModel.setProperty('/dialog/busy', false);
        }
      },

      onPressDetailDialogClose() {
        this.oDialog.close();
      },

      navToProfile(oEvent) {
        const sPernr = oEvent.getSource().getBindingContext().getProperty('Pernr');
        this.oController.reduceViewResource().getRouter().navTo('mobile/m/employee-detail', { pernr: sPernr });
      },

      setBusy(bBusy = true) {
        setTimeout(
          () => {
            this.oPortletModel.setProperty('/dialog/busy', bBusy);
          },
          bBusy ? 0 : 500
        );
        return this;
      },

      destroy() {
        this.oDialog.destroy();
      },
    });
  }
);
