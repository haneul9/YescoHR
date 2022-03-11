sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/ComboEntry',
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
    ComboEntry,
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
          Total: {},
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
        return this.getBundleText('MSG_14001', sYear);
      },

      formatNumber(vNum = '0') {
        return !vNum ? '0' : _.parseInt(vNum);
      },

      async onObjectMatched() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          const oModel = this.getModel(ServiceNames.BENEFIT);
          const mPayLoad = {
            Cdnum: 'PA0005',
          };

          // 교육형태
          const aEduTypeList = await Client.getEntitySet(oModel, 'BenefitCodeList', mPayLoad);

          oListModel.setProperty('/EduType', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aEduTypeList }));

          // 나의 교육이력
          const [aMyEdu] = await this.getMyEdu();

          oListModel.setProperty('/Total', aMyEdu);

          oListModel.setProperty('/search', {
            date: moment().startOf('year').hours(9).toDate(),
            secondDate: moment().endOf('year').hours(9).toDate(),
            Lntyp: 'ALL',
            Lntyptx: '',
          });

          const aTableList = await this.getEducationList();
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

          // 나의 교육이력
          const [aMyEdu] = await this.getMyEdu();

          oListModel.setProperty('/Total', aMyEdu);

          oListModel.setProperty('/search', {
            date: moment().startOf('year').hours(9).toDate(),
            secondDate: moment().endOf('year').hours(9).toDate(),
            Lntyp: 'ALL',
            Lntyptx: '',
          });

          const aTableList = await this.getEducationList();
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

      // override AttachFileCode
      getApprovalType() {
        return 'HR19';
      },

      // 조회
      async onSearch() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          const aTableList = await this.getEducationList();
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
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_31001');

        TableUtils.export({ oTable, aTableData, sFileName });
      },
    });
  }
);
