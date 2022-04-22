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
    'sap/ui/yesco/mvc/model/type/Date',
    'sap/ui/yesco/mvc/model/type/Decimal',
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

    return Debuggable.extend('sap.ui.yesco.common.EmployeeListDialogHandler', {
      oController: null,
      oDialog: null,

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
            rowCount: 0,
            totalCount: 0,
            list: null,
          },
        };
      },

      async init() {
        const oView = this.oController.getView();

        this.oDialog = await Fragment.load({
          id: oView.getId(),
          name: 'sap.ui.yesco.fragment.EmployeeListDialog',
          controller: this,
        });

        this.oDialog.setModel(this.oDialogModel).bindElement('/dialog');

        oView.addDependent(this.oDialog);
      },

      async openDialog(oParam) {
        try {
          setTimeout(() => {
            this.setBusy();
            this.oDialog.open();
          });

          let mPayload;
          if (oParam instanceof sap.ui.base.Event) {
            // Portlet 같은 곳에서 Headty, Discod 만 넘어오는 경우
            const oSessionProperty = this.oController.getSessionModel().getData();
            const oEventSourceData = oParam.getSource().data();
            mPayload = {
              Zyear: moment().year(),
              Werks: oSessionProperty.Werks,
              Orgeh: oSessionProperty.Orgeh,
              Headty: oEventSourceData.Headty,
              Discod: oEventSourceData.Discod,
            };
          } else {
            // MSS 인원현황 메뉴 같은 곳에서 oParam에 검색 조건이 모두 포함되어 넘어오는 경우
            delete oParam.OData;

            mPayload = oParam;
          }

          const aEmployees = await Client.getEntitySet(this.oController.getModel(ServiceNames.PA), 'HeadCountDetail', mPayload);

          this.oDialogModel.setProperty('/dialog/rowCount', Math.min(aEmployees.length, 12));
          this.oDialogModel.setProperty('/dialog/totalCount', _.size(aEmployees));
          this.oDialogModel.setProperty(
            '/dialog/list',
            _.map(aEmployees, (o, i) => ({ Idx: ++i, ...o }))
          );
        } catch (oError) {
          this.debug('EmployeeListDialogHandler > openDialog Error', oError);

          AppUtils.handleError(oError, {
            onClose: () => this.closeDialog(),
          });
        } finally {
          if (this.oController.byId('overviewEmpDetailTable')) {
            this.oController.byId('overviewEmpDetailTable').setFirstVisibleRow();
          }
          this.setBusy(false);
        }
      },

      closeDialog() {
        this.oDialog.close();
      },

      formatDetailRowHighlight(sValue) {
        switch (_.toNumber(sValue)) {
          case 1:
            return sap.ui.core.IndicationColor.Indication03;
          case 2:
            return sap.ui.core.IndicationColor.Indication02;
          case 3:
            return sap.ui.core.IndicationColor.Indication04;
          default:
            return null;
        }
      },

      onPressEmployeeRow(oEvent) {
        const sHost = window.location.href.split('#')[0];
        const mRowData = oEvent.getSource().getParent().getBindingContext().getObject();
        const sUsrty = this.oController.isMss() ? 'M' : this.oController.isHass() ? 'H' : '';

        window.open(`${sHost}#/employeeView/${mRowData.Pernr}/${sUsrty}`, '_blank', 'width=1400,height=800');
      },

      onPressExcelDownload() {
        const oTable = this.oController.byId('overviewEmpDetailTable');
        const sFileName = this.oController.getBundleText('LABEL_00282', 'LABEL_28038'); // 인원현황상세

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
