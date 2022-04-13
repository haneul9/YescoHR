sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/Debuggable',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/home/portlets/AbstractPortletHandler',
    'sap/ui/yesco/mvc/model/type/Currency', // XML expression binding용 type preloading
  ],
  (
    // prettier 방지용 주석
    Fragment,
    Debuggable,
    TableUtils,
    Client,
    ServiceNames
  ) => {
    'use strict';

    /**
     * 인원 현황 Portlet (임원용) Dialog Handler
     */
    return Debuggable.extend('sap.ui.yesco.mvc.controller.home.portlets.popup.M21PortletDialogHandler', {
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
          name: 'sap.ui.yesco.mvc.view.overviewEmployee.fragment.DialogDetail',
          controller: this,
        });

        this.oPortletModel.setProperty('/dialog', {
          busy: true,
          rowCount: 0,
          totalCount: 0,
          list: [],
        });

        this.oDialog.setModel(this.oPortletModel);

        oView.addDependent(this.oDialog);
      },

      async openDialog(oEvent) {
        this.oPortletModel.setProperty('/dialog/busy', true);

        try {
          this.oDialog.open();

          const oSessionModel = this.oController.getSessionModel();
          const mPayload = {
            Zyear: moment().year(),
            Werks: oSessionModel.getProperty('/Werks'),
            Orgeh: oSessionModel.getProperty('/Orgeh'),
            Headty: 'A',
            Discod: oEvent.getSource().data('Discod'),
          };
          const aDetailData = await Client.getEntitySet(this.oController.getModel(ServiceNames.PA), 'HeadCountDetail', mPayload);

          this.oPortletModel.setProperty('/dialog/rowCount', Math.min(aDetailData.length, 12));
          this.oPortletModel.setProperty('/dialog/totalCount', _.size(aDetailData));
          this.oPortletModel.setProperty(
            '/dialog/list',
            _.map(aDetailData, (o, i) => ({ Idx: ++i, ...o }))
          );
        } catch (oError) {
          this.oController.debug('M21PortletDialogHandler > openDialog Error', oError);

          AppUtils.handleError(oError, {
            onClose: () => this.oDialog.close(),
          });
        } finally {
          if (this.oController.byId('overviewEmpDetailTable')) {
            this.oController.byId('overviewEmpDetailTable').setFirstVisibleRow();
          }
          this.oPortletModel.setProperty('/dialog/busy', false);
        }
      },

      onPressDetailDialogClose() {
        this.oDialog.close();
      },

      onPressEmployeeRow(oEvent) {
        const sHost = window.location.href.split('#')[0];
        const mRowData = oEvent.getSource().getParent().getBindingContext().getObject();
        const sUsrty = this.oController.isMss() ? 'M' : this.oController.isHass() ? 'H' : '';

        window.open(`${sHost}#/employeeView/${mRowData.Pernr}/${sUsrty}`, '_blank', 'width=1400,height=800');
      },

      onPressDetailExcelDownload() {
        const oTable = this.oController.byId('overviewEmpDetailTable');
        const aTableData = this.oPortletModel.getProperty('/dialog/list');
        const sFileName = this.oController.getBundleText('LABEL_00282', 'LABEL_28038'); // 인원현황상세

        TableUtils.export({ oTable, aTableData, sFileName, aDateProps: ['Gbdat', 'Entda', 'Loada', 'Reida', 'Retda'] });
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

      destroy() {
        this.oDialog.destroy();
      },
    });
  }
);
