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

    return BaseController.extend('sap.ui.yesco.mvc.controller.commuteConfirm.CommuteConfirm', {
      AttachFileAction: AttachFileAction,
      TableUtils: TableUtils,
      TextUtils: TextUtils,
      FragmentEvent: FragmentEvent,

      initializeModel() {
        return {
          busy: false,
          OrgList: [],
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

      async onObjectMatched() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          const aTableList = await this.getWorkScheduleList();
          const oTable = this.byId('commuteTable');

          oListModel.setProperty('/listInfo', {
            ...TableUtils.count({ oTable, aRowData: aTableList }),
            ObjTxt1: this.getBundleText('LABEL_00197'), // 미신청
          });
          oListModel.setProperty('/CommuteList', aTableList);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      onClick() {
        const oViewModel = this.getViewModel();
        const mSelectRow = oViewModel.getProperty('/SelectedRow');

        if (_.isEmpty(mSelectRow)) {
          // 신청할 데이터를 한 건만 선택하세요.
          MessageBox.alert(this.getBundleText('MSG_30003'));
          return;
        } else if (mSelectRow.Appyn !== 'X') {
          // 신청 가능한 내역이 아닙니다.
          MessageBox.alert(this.getBundleText('MSG_30004'));
          return;
        }
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
          const oTable = this.byId('commuteTable');

          oListModel.setProperty('/listInfo', {
            ...TableUtils.count({ oTable, aRowData: aTableList }),
            ObjTxt1: this.getBundleText('LABEL_00197'),
          });
          oListModel.setProperty('/CommuteList', aTableList);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      // table 체크박스
      onRowSelection(oEvent) {
        const oViewModel = this.getViewModel();
        const oEventSource = oEvent.getSource();
        const iSelectedIndex = oEventSource.getSelectedIndex();

        oEventSource.setSelectedIndex(iSelectedIndex);
        oViewModel.setProperty('/SelectedRow', oViewModel.getProperty(`/CommuteList/${iSelectedIndex}`));
      },

      // 시차출퇴근신청
      async getWorkScheduleList() {
        const oListModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const mSearch = oListModel.getProperty('/search');
        const mPayLoad = {
          Prcty: 'L',
          Begym: mSearch.date,
          Endym: mSearch.secondDate,
          Pernr: this.getAppointeeProperty('Pernr'),
        };

        return await Client.getEntitySet(oModel, 'WorkScheduleApply', mPayLoad);
      },

      onPressExcelDownload() {
        const oTable = this.byId('commuteTable');
        const aTableData = this.getViewModel().getProperty('/CommuteList');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_30006'); // 시차출퇴근 확정

        TableUtils.export({ oTable, aTableData, sFileName });
      },
    });
  }
);
