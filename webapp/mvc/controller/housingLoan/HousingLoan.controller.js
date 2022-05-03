sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    ComboEntry,
    Client,
    ServiceNames,
    ODataReadError,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.housingLoan.HousingLoan', {
      initializeModel() {
        return {
          busy: false,
          Data: [],
          LoanType: [],
          search: {
            date: moment().endOf('year').hours(9).toDate(),
            secondDate: moment().set('year', 1900).set('month', 0).set('date', 1).hours(9).toDate(),
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
        };
      },

      async onObjectMatched() {
        const oListModel = this.getViewModel();

        oListModel.setProperty('/busy', true);

        try {
          const oModel = this.getModel(ServiceNames.BENEFIT);
          const [[mMyLoanAmt], aBenefitCodes] = await Promise.all([
            Client.getEntitySet(oModel, 'LoanAmtMyloan'),
            Client.getEntitySet(oModel, 'BenefitCodeList', {
              Cdnum: 'BE0008',
              Werks: this.getAppointeeProperty('Werks'),
              Datum: new Date(),
              Grcod: 'BE000004',
              Sbcod: 'GRADE',
            }),
          ]);

          oListModel.setProperty('/Total', mMyLoanAmt || {});
          oListModel.setProperty('/search/Lntyp', 'ALL');
          oListModel.setProperty('/LoanType', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aBenefitCodes }));

          await this.readLoanAmtAppl();
        } catch (oError) {
          this.debug('Controller > HousingLoan > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      onClick() {
        this.getRouter().navTo('housingLoan-detail', { oDataKey: 'N' });
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR07';
      },

      formatNumber(vNum = '0') {
        return parseInt(vNum);
      },

      formatPay(vPay = '0') {
        return this.TextUtils.toCurrency(vPay);
      },

      async readLoanAmtAppl() {
        try {
          const oListModel = this.getViewModel();
          const oTable = this.byId('loanTable');
          const mSearch = oListModel.getProperty('/search');
          const dBeginDate = moment(mSearch.secondDate).hours(9).toDate();
          const dEndDate = moment(mSearch.date).hours(9).toDate();
          const vLoanType = !mSearch.Lntyp || mSearch.Lntyp === 'ALL' ? '' : mSearch.Lntyp;
          const aResults = await Client.getEntitySet(this.getModel(ServiceNames.BENEFIT), 'LoanAmtAppl', {
            Prcty: 'L',
            Menid: this.getCurrentMenuId(),
            Apbeg: dBeginDate,
            Apend: dEndDate,
            Lntyp: vLoanType,
          });

          oListModel.setProperty('/List', aResults);
          oListModel.setProperty('/listInfo', this.TableUtils.count({ oTable, aRowData: aResults, sStatCode: 'Lnsta' }));
        } catch (oError) {
          throw oError;
        }
      },

      async onSearch() {
        const oListModel = this.getViewModel();

        oListModel.setProperty('/busy', true);

        try {
          await this.readLoanAmtAppl();
        } catch (oError) {
          this.debug('Controller > HousingLoan > onSearch Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      onSelectRow(oEvent) {
        const vPath = oEvent.getParameters().rowBindingContext.getPath();
        const oListModel = this.getViewModel();
        const oRowData = oListModel.getProperty(vPath);

        oListModel.setProperty('/parameters', oRowData);
        this.getRouter().navTo('housingLoan-detail', { oDataKey: oRowData.Appno });
      },

      onPressExcelDownload() {
        const oTable = this.byId('loanTable');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_07001');

        this.TableUtils.export({ oTable, sFileName, sStatCode: 'Lnsta', sStatTxt: 'Lnstatx' });
      },
    });
  }
);
