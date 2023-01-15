sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    ComboEntry,
    ServiceNames,
    Client,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.medical.Medical', {
      initializeModel() {
        return {
          routeName: '',
          busy: false,
          Data: [],
          LoanType: [],
          parameters: {},
          search: {
            date: new Date(),
            secondDate: moment().startOf('year').hours(9).toDate(),
            Famgb: '',
            Famsa: '',
            Objps: '',
            Kdsvh: '',
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

      async onObjectMatched(oParameter, sRouteName) {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/routeName', sRouteName);
        oViewModel.setProperty('/busy', true);

        try {
          const aFamilyList = await this.getFamilyCode();

          oViewModel.setProperty('/FamilyCode', new ComboEntry({ codeKey: 'Famgb', valueKey: 'Znametx', aEntries: aFamilyList }));
          oViewModel.setProperty('/search/Famgb', 'ALL');
          oViewModel.setProperty('/search/Famsa', 'ALL');
          oViewModel.setProperty('/search/Objps', 'ALL');
          oViewModel.setProperty('/search/Kdsvh', 'ALL');

          this.onSearch();
          this.getAppointeeModel().setProperty('/showChangeButton', this.isHass());
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 대상자 정보 사원선택시 화면 Refresh
      async callbackAppointeeChange() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/busy', true);

        try {
          const aFamilyList = await this.getFamilyCode();

          oViewModel.setProperty('/FamilyCode', new ComboEntry({ codeKey: 'Famgb', valueKey: 'Znametx', aEntries: aFamilyList }));
          oViewModel.setProperty('/search/Famgb', 'ALL');
          oViewModel.setProperty('/search/Famsa', 'ALL');
          oViewModel.setProperty('/search/Objps', 'ALL');
          oViewModel.setProperty('/search/Kdsvh', 'ALL');

          this.onSearch();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      onClick() {
        this.getRouter().navTo(`${this.getViewModel().getProperty('/routeName')}-detail`, { oDataKey: 'N' });
      },

      formatDate(sDate = '') {
        sDate = !sDate || sDate === '000000' ? '' : `${sDate.slice(0, 4)}.${sDate.slice(4, 6)}`;

        return sDate;
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR09';
      },

      formatNumber(vNum = '0') {
        return !vNum ? '0' : vNum;
      },

      formatPay(vPay = '0') {
        return this.TextUtils.toCurrency(vPay);
      },

      thisYear(sYear = String(moment().format('YYYY'))) {
        return this.getBundleText('MSG_09001', sYear);
      },

      async onSearch() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.getProperty('/busy', true);

          const [aList, [mTotal]] = await Promise.all([this.getApplyList(), this.totalCount()]);

          const oTable = this.byId('medTable');
          oViewModel.setProperty('/List', aList);
          oViewModel.setProperty('/Total', mTotal);
          oViewModel.setProperty('/listInfo', this.TableUtils.count({ oTable, aRowData: aList, sStatCode: 'Lnsta' }));
          if (mTotal.Note) {
            oViewModel.setProperty('/listInfo/infoMessage', mTotal.Note);
          }
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.getProperty('/busy', false);
        }
      },

      getFamilyCode() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const mPayLoad = {
          Datum: new Date(),
          Pernr: this.getAppointeeProperty('Pernr'),
        };

        return Client.getEntitySet(oModel, 'MedExpenseSupportList', mPayLoad);
      },

      async getApplyList() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oViewModel = this.getViewModel();
        const mSearch = oViewModel.getProperty('/search');
        const dDate = moment(mSearch.secondDate).hours(9).toDate();
        const dDate2 = moment(mSearch.date).hours(9).toDate();
        const sMenid = this.getCurrentMenuId();
        let sFamgb = '';
        let sFamsa = '';
        let sObjps = '';
        let sKdsvh = '';

        if (!!mSearch.Famgb && mSearch.Famgb !== 'ALL') {
          sFamgb = mSearch.Famgb;
          sFamsa = mSearch.Famsa;
          sObjps = mSearch.Objps;
          sKdsvh = mSearch.Kdsvh;
        }

        const mPayLoad = {
          Prcty: 'L',
          Menid: sMenid,
          Apbeg: dDate,
          Apend: dDate2,
          Famgb: sFamgb,
          Famsa: sFamsa,
          Objps: sObjps,
          Kdsvh: sKdsvh,
          Pernr: this.getAppointeeProperty('Pernr'),
        };

        return Client.getEntitySet(oModel, 'MedExpenseAppl', mPayLoad);
      },

      async totalCount() {
        const oModel = this.getModel(ServiceNames.BENEFIT);

        return Client.getEntitySet(oModel, 'MedExpenseMymed', { Pernr: this.getAppointeeProperty('Pernr') });
      },

      // 대상자 선택시
      onFamilyCode(oEvent) {
        const sKey = oEvent.getSource().getSelectedKey();
        const oViewModel = this.getViewModel();
        const oFCode = oViewModel.getProperty('/FamilyCode');

        oFCode.forEach((e) => {
          if (`${e.Famgb}${e.Famsa}${e.Objps}${e.Kdsvh}` === sKey) {
            oViewModel.setProperty('/search/Famgb', e.Famgb);
            oViewModel.setProperty('/search/Famsa', e.Famsa);
            oViewModel.setProperty('/search/Objps', e.Objps);
            oViewModel.setProperty('/search/Kdsvh', e.Kdsvh);
          } else if ('ALL' === sKey) {
            oViewModel.setProperty('/search/Famgb', '');
            oViewModel.setProperty('/search/Famsa', '');
            oViewModel.setProperty('/search/Objps', '');
            oViewModel.setProperty('/search/Kdsvh', '');
          }
        });
      },

      onSelectRow(oEvent) {
        const oViewModel = this.getViewModel();
        const vPath = oEvent.getParameter('rowBindingContext').getPath();
        const oRowData = oViewModel.getProperty(vPath);

        this.getRouter().navTo(`${oViewModel.getProperty('/routeName')}-detail`, { oDataKey: oRowData.Appno });
      },

      onPressExcelDownload() {
        const oTable = this.byId('medTable');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_09010');

        this.TableUtils.export({ oTable, sFileName, sStatCode: 'Lnsta', sStatTxt: 'Lnstatx' });
      },
    });
  }
);
