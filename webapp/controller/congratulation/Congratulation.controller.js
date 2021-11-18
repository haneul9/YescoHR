sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/EmpInfo',
    'sap/ui/yesco/controller/BaseController',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/FragmentEvent',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
	EmpInfo,
	BaseController,
	ServiceNames,
	AttachFileAction,
	TableUtils,
	FragmentEvent
  ) => {
    'use strict';

    class Congratulation extends BaseController {
      constructor() {
        super();
        this.formatter = formatter;
        this.AttachFileAction = AttachFileAction;
        this.TableUtils = TableUtils;
        this.FragmentEvent = FragmentEvent;
        this.TYPE_CODE = 'HR01';
      }

      onBeforeShow() {
        const dDate = new Date();
        const oViewModel = new JSONModel({
          busy: false,
          Data: [],
          searchDate: {
            date: dDate,
            secondDate: new Date(dDate.getFullYear(), dDate.getMonth() - 1, dDate.getDate() + 1),
          },
          listInfo: {
            rowCount: 1,
            totalCount: 0,
            progressCount: 0,
            applyCount: 0,
            approveCount: 0,
            rejectCount: 0,
            completeCount: 0,
          },
        });
        this.setViewModel(oViewModel);

        EmpInfo.get.call(this, true);
      }

      onAfterShow() {
        this.onSearch();
        this.getTotalPay();
        super.onAfterShow();
      }

      onClick() {
        this.getRouter().navTo('congratulation-detail', { oDataKey: 'N' });
      }

      formatNumber(vNum) {
        if (!vNum || vNum === '') return '0';

        return vNum;
      }

      formatPay(vPay) {
        if (!vPay || vPay === '0') return '0';

        return `${vPay}${this.getBundleText('LABEL_00157')}`;
      }

      getTotalPay() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oTotalModel = this.getViewModel();
        const sUrl = '/ConExpenseMyconSet';

        oModel.read(sUrl, {
          success: (oData) => {
            if (oData) {
              this.debug(`${sUrl} success.`, oData);
              const oTotal = oData.results[0];

              oTotalModel.setProperty('/Total', oTotal);
            }
          },
          error: (oRespnse) => {
            this.debug(`${sUrl} error.`, oRespnse);
          },
        });
      }

      onSearch() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oListModel = this.getViewModel();
        const oSearchDate = oListModel.getProperty("/searchDate");
        const dDate = moment(oSearchDate.secondDate).hours(10).toDate();
        const dDate2 = moment(oSearchDate.date).hours(10).toDate();

        oListModel.setProperty('/busy', true);

        oModel.read('/ConExpenseApplSet', {
          filters: [
            new sap.ui.model.Filter('Prcty', sap.ui.model.FilterOperator.EQ, 'L'),
            new sap.ui.model.Filter('Actty', sap.ui.model.FilterOperator.EQ, 'E'),
            new sap.ui.model.Filter('Apbeg', sap.ui.model.FilterOperator.EQ, dDate),
            new sap.ui.model.Filter('Apend', sap.ui.model.FilterOperator.EQ, dDate2),
          ],
          success: (oData) => {
            if (oData) {
              const oList = oData.results.map((o) => {
                return {
                  ...o,
                  Pernr: parseInt(o.Pernr, 10),
                };
              });

              TableUtils.count.call(this, oList);
              oListModel.setProperty('/CongList', oList);
              this.byId('conguTable').setVisibleRowCount(oList.length);
              oListModel.setProperty('/busy', false);
            }
          },
          error: (oRespnse) => {
            oListModel.setProperty('/busy', false);
          },
        });
      }

      onSelectRow(oEvent) {
        const vPath = oEvent.getParameters().rowBindingContext.getPath();
        const oRowData = this.getViewModel().getProperty(vPath);

        this.getRouter().navTo('congratulation-detail', { oDataKey: oRowData.Appno });
      }

      onPressExcelDownload() {
        const oTable = this.byId('conguTable');
        const mTableData = this.getViewModel().getProperty('/CongList');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_02022');

        TableUtils.export({ oTable, mTableData, sFileName });
      }
    }

    return Congratulation;
  }
);
