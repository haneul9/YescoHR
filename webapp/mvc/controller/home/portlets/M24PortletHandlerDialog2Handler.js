sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/Debuggable',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    JSONModel,
    AppUtils,
    TableUtils,
    Debuggable,
    Client,
    ServiceNames
  ) => {
    'use strict';

    return Debuggable.extend('sap.ui.yesco.mvc.controller.home.portlets.M24PortletHandlerDialog2Handler', {
      constructor: function (oController) {
        this.oController = oController;
        this.oDialogModel = new JSONModel(this.getInitialData());
        this.oDialogModel.setSizeLimit(10000);

        this.init();
      },

      getInitialData() {
        return {
          dialog: {
            busy: true,
            sub: {
              rowCount: 0,
              totalCount: 0,
              list: null,
            },
          },
        };
      },

      async init() {
        this.setPropertiesForNavTo();

        const oView = this.oController.getView();

        this.oDialog = await Fragment.load({
          id: oView.getId(),
          name: 'sap.ui.yesco.mvc.view.overviewAttendance.fragment.DialogDetail5',
          controller: this,
        });

        this.oDialog.setModel(this.oDialogModel);

        oView.addDependent(this.oDialog);
      },

      async setPropertiesForNavTo() {
        const oMenuModel = AppUtils.getAppComponent().getMenuModel();
        await oMenuModel.getPromise();

        this.bHasProfileViewAuth = oMenuModel.hasEmployeeProfileViewAuth();
      },

      async openDialog(mPayload) {
        try {
          setTimeout(() => {
            this.setBusy();
            this.oDialog.open();
          });

          this.mPayload = mPayload;

          const aEmployees = await Client.getEntitySet(this.oController.getModel(ServiceNames.WORKTIME), 'TimeOverviewDetail5', mPayload);

          this.oDialogModel.setProperty('/dialog/sub/rowCount', Math.min(aEmployees.length, 12));
          this.oDialogModel.setProperty('/dialog/sub/totalCount', _.size(aEmployees));
          this.oDialogModel.setProperty(
            '/dialog/sub/list',
            _.map(aEmployees, (o, i) => ({
              Idx: ++i,
              Navigable: this.bHasProfileViewAuth ? 'O' : '',
              ...o,
            }))
          );
        } catch (oError) {
          this.debug('M24PortletHandlerDialog2Handler > openDialog Error', oError);

          AppUtils.handleError(oError, {
            onClose: () => this.onPressDetail5DialogClose(),
          });
        } finally {
          setTimeout(() => this.oDialog.getContent()[1].getItems()[0].setFirstVisibleRow(), 100);
          this.setBusy(false);
        }
      },

      onPressDetail5DialogClose() {
        this.oDialog.close();
      },

      onPressEmployeeRow(oEvent) {
        if (!this.bHasProfileViewAuth) {
          return;
        }

        const sHost = window.location.href.split('#')[0];
        const sPernr = oEvent.getSource().getParent().getBindingContext().getProperty('Pernr');
        const oDatum = moment(this.mPayload.Datum);

        window.open(`${sHost}#/individualWorkStateView/${sPernr}/${oDatum.get('year')}/${oDatum.get('month')}`, '_blank', 'width=1400,height=800');
      },

      onPressDetailExcelDownload(oEvent) {
        const oTable = oEvent.getSource().getParent().getParent().getParent();
        const sFileName = this.oController.getBundleText('LABEL_00282', 'LABEL_28040'); // 근태현황상세

        TableUtils.export({ oTable, sFileName });
      },

      setBusy(bBusy = true) {
        setTimeout(
          () => {
            this.oDialogModel.setProperty('/dialog/busy', bBusy);
          },
          bBusy ? 0 : 500
        );
        return this;
      },

      destroy() {
        this.oDialog.destroy();
        this.oDialogModel.destroy();
      },
    });
  }
);
