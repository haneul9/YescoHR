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
    BaseController,
    Date
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.commuteType.CommuteType', {
      AttachFileAction: AttachFileAction,
      TableUtils: TableUtils,
      TextUtils: TextUtils,
      FragmentEvent: FragmentEvent,

      initializeModel() {
        return {
          busy: false,
          CommuteList: [],
          MyCom: {},
          SelectedRow: {},
          searchDate: {},
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

      // 신청내역 checkBox Visible
      tableRowCheckbox() {
        const tbl = this.getView().byId('commuteTable');
        // const header = tbl.$().find('.sapUiTableColHdrCnt');
        // const selectAllCb = header.find('.sapMCb');

        // selectAllCb.remove();

        _.forEach(tbl.getRows(), (r) => {
          const obj = r.getBindingContext().getObject();
          const oAppyn = obj.Appyn;
          const cb = r.$().find('.sapUiTableSelectAllCheckBox');
          const oCb = sap.ui.getCore().byId(cb.attr('id'));

          if (!oAppyn) {
            oCb.setVisible(false);
          }
        });
      },

      async onObjectMatched() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          // 나의 근무일정
          const [aMyCom] = await this.getMySchedule();

          oListModel.setProperty('/MyCom', aMyCom);

          const dDate = aMyCom.Zyymm;

          oListModel.setProperty('/searchDate', {
            date: moment(dDate).month('0').format('yyyyMM'),
            secondDate: moment(dDate).format('yyyyMM'),
          });

          const aTableList = await this.getWorkScheduleList();
          const oTable = this.byId('commuteTable');

          oListModel.setProperty('/listInfo', {
            ...TableUtils.count({ oTable, aRowData: aTableList }),
            ObjTxt1: this.getBundleText('LABEL_00197'),
          });
          oListModel.setProperty('/CommuteList', aTableList);

          this.getAppointeeModel().setProperty('/showChangeButton', this.isHass());
          // setTimeout(() => {
          //   this.tableRowCheckbox();
          // }, 1500);
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
          const [aMyCom] = await this.getMySchedule();

          oListModel.setProperty('/MyCom', aMyCom);

          const dDate = aMyCom.Zyymm;

          oListModel.setProperty('/searchDate', {
            date: moment(dDate).month('0').format('yyyyMM'),
            secondDate: moment(dDate).format('yyyyMM'),
          });

          const aTableList = await this.getWorkScheduleList();
          const oTable = this.byId('commuteTable');

          oListModel.setProperty('/listInfo', {
            ...TableUtils.count({ oTable, aRowData: aTableList }),
            ObjTxt1: this.getBundleText('LABEL_00197'),
          });
          oListModel.setProperty('/CommuteList', aTableList);
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

        this.getRouter().navTo('commuteType-detail', { oDataKey: 'N', zyymm: mSelectRow.Zyymm, schkz: mSelectRow.Schkz });
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
          const oTable = this.byId('commuteTable');

          oListModel.setProperty('/listInfo', {
            ...TableUtils.count({ oTable, aRowData: aTableList }),
            ObjTxt1: this.getBundleText('LABEL_00197'),
          });
          oListModel.setProperty('/CommuteList', aTableList);
          this.getAppointeeModel().setProperty('/showChangeButton', this.isHass());
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      // 조회년월 선택
      onSearchDate() {
        this.searchCheck();
      },

      // 조회년월 체크
      searchCheck() {
        const oListModel = this.getViewModel();
        const mSearch = oListModel.getProperty('/searchDate');

        if (_.parseInt(mSearch.date) > _.parseInt(mSearch.secondDate)) {
          // 조회조건이 잘못 선택 되었습니다.
          MessageBox.alert(this.getBundleText('MSG_30002'));
          return true;
        }

        return false;
      },

      // table 체크박스
      onRowSelection(oEvent) {
        const oViewModel = this.getViewModel();
        const oEventSource = oEvent.getSource();

        oEventSource.setSelectedIndex(oEventSource.getSelectedIndex());
        oViewModel.setProperty('/SelectedRow', oViewModel.getProperty(oEvent.getParameter('rowContext').getPath()));
      },

      // 나의 근무일정
      async getMySchedule() {
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const mMyWorkPayLoad = {
          Pernr: this.getAppointeeProperty('Pernr'),
        };

        return await Client.getEntitySet(oModel, 'MyWorkSchedule', mMyWorkPayLoad);
      },

      // 시차출퇴근신청
      async getWorkScheduleList() {
        const oListModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const mSearch = oListModel.getProperty('/searchDate');
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
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_30001');

        TableUtils.export({ oTable, aTableData, sFileName });
      },
    });
  }
);
