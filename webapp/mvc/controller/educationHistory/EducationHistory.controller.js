sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date',
  ],
  (
    // prettier 방지용 주석
    MessageBox,
    AppUtils,
    AttachFileAction,
    FragmentEvent,
    TableUtils,
    TextUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.educationHistory.EducationHistory', {
      AttachFileAction: AttachFileAction,
      TableUtils: TableUtils,
      TextUtils: TextUtils,
      FragmentEvent: FragmentEvent,

      initializeModel() {
        return {
          busy: false,
          EduList: [],
          EduType: [],
          MyEdu: {},
          search: {},
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

      thisYear(sYear = String(moment().format('YYYY'))) {
        // {0}년의 현황입니다.
        return this.MSG_31002('MSG_14001', sYear);
      },

      formatNumber(vNum = '0') {
        return _.parseInt(vNum);
      },

      async onObjectMatched() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          // 나의 근무일정
          const [aMyEdu] = await this.getMyEdu();

          oListModel.setProperty('/MyEdu', aMyEdu);

          oListModel.setProperty('/search', {
            date: moment(dDate).month('0').format('yyyyMM'),
            secondDate: moment(dDate).format('yyyyMM'),
            Lntyp: 'ALL',
            Lntyptx: '',
          });

          const aTableList = await this.getWorkScheduleList();
          const oTable = this.byId('eduTable');

          oListModel.setProperty('/listInfo', {
            ...TableUtils.count({ oTable, aRowData: aTableList }),
            visibleStatus: 'X',
            Title: this.getBundleText('LABEL_31001'), // 교육이력
          });
          oListModel.setProperty('/EduList', aTableList);

          this.getAppointeeModel().setProperty('/showChangeButton', this.isHass());
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      // 대상자 정보 사원선택시 화면 Refresh
      async onRefresh() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          // 나의 근무일정
          const [aMyEdu] = await this.getMyEdu();

          oListModel.setProperty('/MyEdu', aMyEdu);

          oListModel.setProperty('/search', {
            date: moment(dDate).month('0').format('yyyyMM'),
            secondDate: moment(dDate).format('yyyyMM'),
          });

          const aTableList = await this.getWorkScheduleList();
          const oTable = this.byId('eduTable');

          oListModel.setProperty('/listInfo', {
            ...TableUtils.count({ oTable, aRowData: aTableList }),
            visibleStatus: 'X',
            Title: this.getBundleText('LABEL_31001'), // 교육이력
          });
          oListModel.setProperty('/EduList', aTableList);
          this.getAppointeeModel().setProperty('/showChangeButton', this.isHass());
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      // 나의 근무일정 대상년월 Text
      formatSchedule(sYymm = moment().format('yyyy.MM'), dSDate, dEDate) {
        const dS = moment(dSDate).format('yyyy.MM.DD') || moment().format('yyyy.MM.DD');
        const dD = moment(dEDate).format('yyyy.MM.DD') || moment().format('yyyy.MM.DD');

        return `${this.getBundleText('LABEL_30005', moment(sYymm).format('yyyy.MM'), dS, dD)}`;
      },

      onClick() {
        const oViewModel = this.getViewModel();
        const aSelectRow = oViewModel.getProperty('/SelectedRow');

        if (_.isEmpty(aSelectRow) || _.size(aSelectRow) > 1) {
          // 신청할 데이터를 한 건만 선택하세요.
          MessageBox.alert(this.getBundleText('MSG_30003'));
          return;
        }

        this.getRouter().navTo('commuteType-detail', { oDataKey: 'N', zyymm: aSelectRow[0].Zyymm, schkz: aSelectRow[0].Schkz });
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR19';
      },

      // 조회
      async onSearch() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          if (this.searchCheck()) {
            return;
          }

          const aTableList = await this.getWorkScheduleList();
          const oTable = this.byId('eduTable');

          oListModel.setProperty('/listInfo', {
            ...TableUtils.count({ oTable, aRowData: aTableList }),
            visibleStatus: 'X',
            Title: this.getBundleText('LABEL_31001'), // 교육이력
          });
          oListModel.setProperty('/EduList', aTableList);
          this.getAppointeeModel().setProperty('/showChangeButton', this.isHass());
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      // 나의 교육이력
      async getMyEdu() {
        const oModel = this.getModel(ServiceNames.PA);
        const mMyEduPayLoad = {
          Pernr: this.getAppointeeProperty('Pernr'),
        };

        return await Client.getEntitySet(oModel, 'EducationView', mMyEduPayLoad);
      },

      // 교육이력현황
      async getEducationList() {
        const oListModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.PA);
        const mSearch = oListModel.getProperty('/search');
        const mPayLoad = {
          Lcnam: mSearch.Lcnam,
          Lctyp: mSearch.Lctyp,
          Begda: mSearch.date,
          Endda: mSearch.secondDate,
          Pernr: this.getAppointeeProperty('Pernr'),
        };

        return await Client.getEntitySet(oModel, 'EducationList', mPayLoad);
      },

      onPressExcelDownload() {
        const oTable = this.byId('eduTable');
        const aTableData = this.getViewModel().getProperty('/EduList');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_30001');

        TableUtils.export({ oTable, aTableData, sFileName });
      },
    });
  }
);
