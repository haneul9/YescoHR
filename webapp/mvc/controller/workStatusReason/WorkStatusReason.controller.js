sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    AppUtils,
    Client,
    ServiceNames,
    MessageBox,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.workStatusReason.WorkStatusReason', {
      APP_TABLE_ID: 'appTable',

      initializeModel() {
        return {
          busy: false,
          Data: [],
          manager: this.isHass() || this.isMss(),
          search: {
            werksList: [],
            orgList: [],
            jobList: [],
            Werks: '',
            Orgeh: '',
            Awart: '',
            date: moment(`${moment().year()}-01-01`).hours(9).toDate(),
            secondDate: moment(`${moment().year()}-12-31`).hours(9).toDate(),
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
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const oModel = this.getModel(ServiceNames.WORKTIME);
          const oCommonModel = this.getModel(ServiceNames.COMMON);
          const mAppointee = this.getAppointeeData();
          const [aPersaEntry, aOrgehEntry, aJobEntry] = await Promise.all([
            Client.getEntitySet(oCommonModel, 'WerksList', { Pernr: mAppointee.Pernr }), //
            Client.getEntitySet(oCommonModel, 'DashboardOrgList', { Werks: mAppointee.Werks, Pernr: mAppointee.Pernr }),
            Client.getEntitySet(oModel, 'TimeCodeList', { Pernr: mAppointee.Pernr }),
          ]);

          oViewModel.setProperty('/search/werksList', aPersaEntry);
          oViewModel.setProperty('/search/orgList', aOrgehEntry);
          oViewModel.setProperty('/search/jobList', aJobEntry);
          oViewModel.setProperty('/search/Werks', mAppointee.Werks);
          oViewModel.setProperty('/search/Orgeh', _.some(aOrgehEntry, (o) => o.Orgeh === mAppointee.Orgeh) ? mAppointee.Orgeh : _.get(aOrgehEntry, [0, 'Orgeh']));
          this.getAppSearch();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      setTime(sTime) {
        return !sTime ? '' : `${sTime.slice(0, 2)}:${sTime.slice(2)}`;
      },

      async getAppSearch() {
        const oViewModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const mSearch = this.getViewModel().getProperty('/search');
        let mPayLoad = {
          Pernr: this.getAppointeeProperty('Pernr'),
          BegdaS: moment(mSearch.date).hours(9).toDate(),
          EnddaS: moment(mSearch.secondDate).hours(9).toDate(),
          Werks: mSearch.Werks,
          Orgeh: mSearch.Orgeh,
          Awart: mSearch.Awart,
        };

        if (_.chain(mPayLoad.Awart).compact().isEmpty().value()) {
          mPayLoad = _.omit(mPayLoad, 'Awart');
        }

        const aTableList = await Client.getEntitySet(oModel, 'TimeReasonList', mPayLoad);
        const oTable = this.byId(this.APP_TABLE_ID);

        _.map(aTableList, (e, i) => {
          e.No = i + 1;
        });
        oViewModel.setProperty('/listInfo', {
          ...this.TableUtils.count({ oTable, aRowData: aTableList }),
          visibleStatus: 'X',
          // 신청번호를 클릭하면 WeLS의 결재문서가 조회됩니다. (단, 본인이 걸재선에 있는 경우에 한함)
          infoMessage: this.getBundleText('MSG_38001'),
        });
        oViewModel.setProperty('/List', aTableList);
      },

      async onChangeWerks() {
        const oViewModel = this.getViewModel();

        try {
          const mAppointee = this.getAppointeeData();
          const aOrgehEntry = await Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'DashboardOrgList', {
            Werks: oViewModel.getProperty('/search/Werks'),
            Pernr: mAppointee.Pernr,
          });

          oViewModel.setProperty('/search/orgList', aOrgehEntry);
          oViewModel.setProperty('/search/Orgeh', _.some(aOrgehEntry, (o) => o.Orgeh === mAppointee.Orgeh) ? mAppointee.Orgeh : _.get(aOrgehEntry, [0, 'Orgeh']));
        } catch (oError) {
          AppUtils.handleError(oError);
        }
      },

      async onSearch() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);
          this.getAppSearch();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      onPressEname(oEvent) {
        const sPath = oEvent.getSource().getBindingContext().getPath();
        const mSelectData = this.getViewModel().getProperty(sPath);

        this.getRouter().navTo('individualWorkState', {
          pernr: mSelectData.Pernr,
          year: moment(mSelectData.Begda).year(),
          month: moment(mSelectData.Begda).month(),
        });
      },

      onPressExcelDownload() {
        const oTable = this.byId(this.APP_TABLE_ID);
        const sFileName = this.getBundleText('LABEL_38001', 'LABEL_34001'); // {근태사유별 현황}_목록

        this.TableUtils.export({ oTable, sFileName });
      },
    });
  }
);
