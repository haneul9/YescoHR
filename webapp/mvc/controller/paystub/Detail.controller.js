/* eslint-disable no-else-return */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date',
    'sap/ui/yesco/mvc/model/type/Currency',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    Client,
    ServiceNames,
    TableUtils,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.paystub.Detail', {
      getPreviousRouteName() {
        return 'paystub';
      },

      initializeModel() {
        return {
          busy: false,
          Seqnr: null,
          summary: { rowCount: 1, list: [] },
          pay: { rowCount: 2, visibleHeader: true, list: [] },
          deduction: { rowCount: 2, list: [] },
          tax: { rowCount: 2, list: [] },
          work: { rowCount: 1, list: [] },
          base: { rowCount: 1, list: [] },
        };
      },

      onBeforeShow() {
        TableUtils.summaryColspan({ oTable: this.byId('payTable'), aHideIndex: [1, 2] });
      },

      async onObjectMatched(oParameter) {
        const oViewModel = this.getViewModel();

        oViewModel.setData(this.initializeModel());
        oViewModel.setProperty('/Seqnr', oParameter.seqnr);

        this.loadPage();
      },

      getCurrentLocationText() {
        return this.getBundleText('LABEL_00168'); // 상세내역
      },

      async loadPage() {
        const oModel = this.getModel(ServiceNames.PAY);
        const oViewModel = this.getViewModel();
        const sSeqnr = oViewModel.getProperty('/Seqnr');

        if (!sSeqnr) return;

        oViewModel.setProperty('/busy', true);

        try {
          const mDetail = await Client.deep(oModel, 'PayslipList', {
            Menid: this.getCurrentMenuId(),
            Pernr: this.getAppointeeProperty('Pernr'),
            Seqnr: sSeqnr,
            Payslip1Nav: [],
            Payslip2Nav: [],
            Payslip3Nav: [],
            Payslip4Nav: [],
          });

          // Paylist
          const aPayList = this.transformTreeData({ aTreeData: mDetail.Payslip1Nav.results });
          // Deductlist
          const aDeductlist = this.transformTreeData({ aTreeData: mDetail.Payslip2Nav.results });
          // TaxIncomeList
          const aTaxIncomeList = this.transformTreeData({ aTreeData: mDetail.Payslip3Nav.results });
          // TimeList
          const aTimeList = [...mDetail.Payslip4Nav.results];
          // BaseList
          const aBaseList = _.groupBy(mDetail.Payslip1Nav.results, 'Uppno')[''] ?? [];

          oViewModel.setProperty('/summary/list', [{ ...mDetail }]);
          oViewModel.setProperty('/pay/visibleHeader', !_.every(mDetail.Payslip1Nav.results, (o) => _.isEmpty(o.Anzhl) && _.chain(o.Betpe).toNumber().isEqual(0).value()));
          oViewModel.setProperty('/pay/list', aPayList);
          oViewModel.setProperty('/pay/rowCount', aPayList.length || 2);
          oViewModel.setProperty('/deduction/list', aDeductlist);
          oViewModel.setProperty('/deduction/rowCount', aDeductlist.length || 2);
          oViewModel.setProperty('/tax/list', aTaxIncomeList);
          oViewModel.setProperty('/tax/rowCount', aTaxIncomeList.length || 2);
          oViewModel.setProperty('/work/list', aTimeList);
          oViewModel.setProperty('/work/rowCount', aTimeList.length || 1);
          oViewModel.setProperty('/base/isShow', !_.every(aBaseList, (o) => _.isEmpty(o.Caltx)));
          oViewModel.setProperty('/base/list', aBaseList);
          oViewModel.setProperty('/base/rowCount', aBaseList.length || 1);

          setTimeout(() => {
            TableUtils.setColorColumn({ oTable: this.byId('summaryTable'), mColorMap: { 5: 'bgType01', 7: 'bgType02', 9: 'bgType03' } });
            TableUtils.setColorColumn({ oTable: this.byId('workTable'), mColorMap: { 0: 'bgType01', 1: 'bgType01' } });
          }, 100);
        } catch (oError) {
          this.debug('Controller > paystub Detail > loadPage Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      transformTreeData({ aTreeData }) {
        const mGroupedByParents = _.groupBy(aTreeData, 'Uppno');
        const mCatsById = _.keyBy(aTreeData, 'Itmno');
        const mSumRow = TableUtils.generateSumRow({
          aTableData: mGroupedByParents[''] ?? [],
          mSumField: { Pyitx: this.getBundleText('LABEL_00172') }, // 합계
          vCalcProps: ['Betrg'],
        });

        if (_.isEmpty(mSumRow)) return [];

        _.each(_.omit(mGroupedByParents, ''), (children, parentId) => (mCatsById[parentId].nodes = children));

        return [...mGroupedByParents[''], mSumRow];
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      async onPressPDFPrint() {
        const oModel = this.getModel(ServiceNames.PAY);
        const oViewModel = this.getViewModel();
        const sSeqnr = oViewModel.getProperty('/Seqnr');

        try {
          const mResult = await Client.get(oModel, 'PayslipList', {
            Menid: this.getCurrentMenuId(),
            Pernr: this.getAppointeeProperty('Pernr'),
            Seqnr: sSeqnr,
          });

          if (mResult.Url) window.open(mResult.Url);
        } catch (oError) {
          this.debug('Controller > paystub Detail > onPressPDFPrint Error', oError);

          AppUtils.handleError(oError);
        }
      },

      onToggleTreeState(oEvent) {
        const oViewModel = this.getViewModel();
        const mParameters = oEvent.getParameters();
        const bExpanded = mParameters.expanded;
        const sRowPath = mParameters.rowContext.getPath();
        const sTableRootPath = sRowPath.split('/list/')[0];
        const iTableVisibleRowCount = oViewModel.getProperty(`${sTableRootPath}/rowCount`);
        const iChildNodesLength = oViewModel.getProperty(sRowPath).nodes.length;

        oViewModel.setProperty(`${sTableRootPath}/rowCount`, bExpanded ? iTableVisibleRowCount + iChildNodesLength : iTableVisibleRowCount - iChildNodesLength);
      },

      /*****************************************************************
       * ! Call OData
       *****************************************************************/
    });
  }
);
