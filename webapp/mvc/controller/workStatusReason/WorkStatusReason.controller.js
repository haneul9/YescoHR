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
            Werks: this.getAppointeeProperty('Werks'),
            Orgeh: this.getAppointeeProperty('Orgeh'),
            Awart: '',
            date: moment().startOf('month').hours(9).toDate(),
            secondDate: moment().endOf('month').hours(9).toDate(),
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

          if (oViewModel.getProperty('/manager')) {
            const [aPersaEntry, aOrgehEntry] = await Promise.all([
              Client.getEntitySet(oCommonModel, 'WerksList', { Pernr: mAppointee.Pernr }), //
              Client.getEntitySet(oCommonModel, 'DashboardOrgList', { Werks: mAppointee.Werks, Pernr: mAppointee.Pernr }),
            ]);

            oViewModel.setProperty('/search/werksList', aPersaEntry);
            oViewModel.setProperty('/search/orgList', aOrgehEntry);
            // oViewModel.setProperty('/search/Orgeh', _.some(aOrgehEntry, (o) => o.Orgeh === mAppointee.Orgeh) ? mAppointee.Orgeh : _.get(aOrgehEntry, [0, 'Orgeh']));
            // oViewModel.setProperty('/search/Werks', mAppointee.Werks);
          }

          const aJobEntry = await Client.getEntitySet(oModel, 'TimeCodeList', { Pernr: mAppointee.Pernr });

          oViewModel.setProperty('/search/jobList', aJobEntry);
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
        const mSearch = oViewModel.getProperty('/search');
        const mAppointee = this.getAppointeeData();
        let mPayLoad = {
          BegdaS: moment(mSearch.date).hours(9).toDate(),
          EnddaS: moment(mSearch.secondDate).hours(9).toDate(),
          Pernr: mAppointee.Pernr,
          Werks: mAppointee.Werks,
          Orgeh: mAppointee.Orgeh,
          Awart: mSearch.Awart,
          Menid: this.getCurrentMenuId(),
        };

        if (_.chain(mPayLoad.Awart).compact().isEmpty().value()) {
          mPayLoad = _.omit(mPayLoad, 'Awart');
        }

        const bManager = oViewModel.getProperty('/manager');

        if (bManager) {
          _.chain(mPayLoad).set('Werks', mSearch.Werks).set('Orgeh', mSearch.Orgeh).value();
        }

        const mListInfo = {
          // 성명 클릭 시 개인근태현황으로 이동함(돌아오기: Back버튼), 신청번호 클릭 시 WeLS 결재문서 조회됨(단, 본인이 결재선에 있는 경우에 한함)
          // 신청번호 클릭 시 WeLS 결재문서 조회됨(단, 본인이 결재선에 있는 경우에 한함)
          infoMessage: bManager ? this.getBundleText('MSG_38002') : this.getBundleText('MSG_38001'),
          isShowProgress: false,
          isShowApply: true,
          isShowApprove: true,
          isShowReject: false,
          isShowComplete: true,
          ObjTxt2: this.getBundleText('LABEL_19008'), // 진행중
          ObjTxt3: this.getBundleText('LABEL_23007'), // 계획
        };

        oViewModel.setProperty('/listInfo', mListInfo);

        try {
          const oModel = this.getModel(ServiceNames.WORKTIME);
          const aTableList = await Client.getEntitySet(oModel, 'TimeReasonList', mPayLoad);
          const oTable = this.byId(this.APP_TABLE_ID);

          _.map(aTableList, (e, i) => {
            e.No = i + 1;
          });
          oViewModel.setProperty('/listInfo', {
            ...mListInfo,
            ...this.TableUtils.count({ oTable, aRowData: aTableList }),
          });
          oViewModel.setProperty('/List', aTableList);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
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
