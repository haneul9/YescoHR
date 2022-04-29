/* eslint-disable no-else-return */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.paystub.mobile.Detail', {
      fIntervalReadPDF: null,

      getPreviousRouteName() {
        return 'mobile/paystub';
      },

      initializeModel() {
        return {
          busy: false,
          Seqnr: null,
          summary: { list: [] },
          pay: { list: [] },
          deduction: { list: [] },
          tax: { list: [] },
          work: { list: [] },
          base: { list: [] },
          retroactive: { list: [] },
        };
      },

      onBeforeShow() {},

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
          // 소급내역
          const aRetroactiveList = [];

          oViewModel.setProperty('/summary/list', [{ ...mDetail }]);
          oViewModel.setProperty('/pay/list', aPayList);
          oViewModel.setProperty('/pay/count', aPayList.length);
          oViewModel.setProperty('/deduction/list', aDeductlist);
          oViewModel.setProperty('/deduction/count', aDeductlist.length);
          oViewModel.setProperty('/tax/list', aTaxIncomeList);
          oViewModel.setProperty('/tax/count', aTaxIncomeList.length);
          oViewModel.setProperty('/work/list', aTimeList);
          oViewModel.setProperty('/work/count', aTimeList.length);
          oViewModel.setProperty('/base/list', aBaseList);
          oViewModel.setProperty('/base/count', aBaseList.length);
          oViewModel.setProperty('/retroactive/list', aRetroactiveList);
          oViewModel.setProperty('/retroactive/count', aRetroactiveList.length);

          await this.getPdfUrl();
          this.fIntervalReadPDF = setInterval(() => this.getPdfUrl(), 25000);
        } catch (oError) {
          this.debug('Controller > paystub Detail > loadPage Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);

          this.getView().addEventDelegate({
            onBeforeHide: () => clearInterval(this.fIntervalReadPDF),
          });
        }
      },

      transformTreeData({ aTreeData }) {
        const mGroupedByParents = _.groupBy(aTreeData, 'Uppno');
        const mCatsById = _.keyBy(aTreeData, 'Itmno');
        const mSumRow = this.TableUtils.generateSumRow({
          aTableData: mGroupedByParents[''] ?? [],
          mSumField: { Uppno: '9999', Pyitx: this.getBundleText('LABEL_00172') }, // 합계
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

          // alert(mResult.Url);
          if (mResult.Url) {
            if (AppUtils.isPRD()) {
              mResult.Url = `https://hrportal.yescoholdings.com:443/${_.chain(mResult.Url).split('/').drop(3).join('/').value()}`;
            }

            window.open(mResult.Url);
          }
        } catch (oError) {
          this.debug('Controller > paystub Detail > onPressPDFPrint Error', oError);

          AppUtils.handleError(oError);
        }
      },

      async getPdfUrl() {
        const oModel = this.getModel(ServiceNames.PAY);
        const oViewModel = this.getViewModel();
        const sSeqnr = oViewModel.getProperty('/Seqnr');

        try {
          const mResult = await Client.get(oModel, 'PayslipList', {
            Menid: this.getCurrentMenuId(),
            Pernr: this.getAppointeeProperty('Pernr'),
            Seqnr: sSeqnr,
          });

          if (mResult.Url && AppUtils.isPRD()) {
            mResult.Url = `https://hrportal.yescoholdings.com:443/${_.chain(mResult.Url).split('/').drop(3).join('/').value()}`;
          }

          this.getViewModel().setProperty('/PdfUrl', mResult.Url);
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
