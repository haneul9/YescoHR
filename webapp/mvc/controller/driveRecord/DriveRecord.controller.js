sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/EmployeeSearch',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Currency',
    'sap/ui/yesco/mvc/model/type/Date', // DatePicker 에러 방지 import : Loading of data failed: Error: Date must be a JavaScript date object
  ],
  (
    // prettier 방지용 주석
    Fragment,
    AppUtils,
    AttachFileAction,
    EmployeeSearch,
    FragmentEvent,
    TableUtils,
    TextUtils,
    Client,
    ServiceNames,
    MessageBox,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.driveRecord.DriveRecord', {
      DRIVE_TABLE_ID: 'driveTable',

      AttachFileAction: AttachFileAction,
      EmployeeSearch: EmployeeSearch,
      TableUtils: TableUtils,
      TextUtils: TextUtils,
      FragmentEvent: FragmentEvent,

      initializeModel() {
        return {
          busy: false,
          Data: [],
          UseList: [
            { Zcode: 'A', Ztext: this.getBundleText('LABEL_34013') }, // 출퇴근
            { Zcode: 'A', Ztext: this.getBundleText('LABEL_34014') }, // 업무
          ],
          Total: {},
          mMyDriveRecord: {},
          dialog: {},
          maxDate: moment().toDate(),
          search: {
            date: moment().subtract(1, 'month').add(1, 'day').hours(9).toDate(),
            secondDate: moment().hours(9).toDate(),
            driveDate: moment().subtract(1, 'month').add(1, 'day').hours(9).toDate(),
            driveSecondDate: moment().hours(9).toDate(),
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

      // 주행거리
      onMileage(oEvent) {
        this.TextUtils.liveChangeCurrency(oEvent);
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);
          oViewModel.setProperty('/FieldLimit', _.assignIn(this.getEntityLimit(ServiceNames.BENEFIT, 'DrivingRecordAppl')));

          const [mMyDriveRecord] = await this.getMyRecord();

          oViewModel.setProperty('/Total', mMyDriveRecord);

          const aTableList = await this.getFriveRecord();
          const oTable = this.byId(this.DRIVE_TABLE_ID);

          oViewModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aTableList }));
          oViewModel.setProperty('/List', aTableList);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 대상자 정보 사원선택시 화면 Refresh
      async onRefresh() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const [mMyDriveRecord] = await this.getMyRecord();

          oViewModel.setProperty('/Total', mMyDriveRecord);

          const aTableList = await this.getFriveRecord();
          const oTable = this.byId(this.DRIVE_TABLE_ID);

          oViewModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aTableList }));
          oViewModel.setProperty('/List', aTableList);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      onClick() {
        const oViewModel = this.getViewModel();
        const mAppointee = this.getAppointeeData();

        this.openDialog({
          New: 'O',
          Datum: moment().toDate(),
          Devty: 'A',
          Corno: oViewModel.getProperty('/Total/Carno'),
          Regpr: mAppointee.Pernr,
          RegprZzjikgb: `${mAppointee.Ename} ${mAppointee.Zzjikgbt}`,
        });
      },

      async onSearch() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const aTableList = await this.getFriveRecord();
          const oTable = this.byId(this.DRIVE_TABLE_ID);

          oViewModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aTableList }));
          oViewModel.setProperty('/List', aTableList);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 차량운행기록부 현황
      async getMyRecord() {
        const oModel = this.getModel(ServiceNames.BENEFIT);

        return await Client.getEntitySet(oModel, 'DrivingRecordMain', { Pernr: this.getAppointeeProperty('Pernr') });
      },

      // 운행기록
      async getFriveRecord() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const mSearch = this.getViewModel().getProperty('/search');
        const mPayLoad = {
          Pernr: this.getAppointeeProperty('Pernr'),
          RegdtBegda: moment(mSearch.driveDate).hours(9).toDate(),
          RegdtEndda: moment(mSearch.driveSecondDate).hours(9).toDate(),
          DatumBegda: moment(mSearch.date).hours(9).toDate(),
          DatumEndda: moment(mSearch.secondDate).hours(9).toDate(),
          Prcty: 'L',
        };

        return await Client.getEntitySet(oModel, 'DrivingRecordAppl', mPayLoad);
      },

      onSelectRow(oEvent) {
        const vPath = oEvent.getParameter('rowBindingContext').getPath();
        const oViewModel = this.getViewModel();
        const mRowData = oViewModel.getProperty(vPath);

        this.openDialog(mRowData);
      },

      openDialog(mRowData = {}) {
        const oViewModel = this.getViewModel();
        const oView = this.getView();

        setTimeout(() => {
          if (!this._pDetailDialog) {
            this._pDetailDialog = Fragment.load({
              id: oView.getId(),
              name: 'sap.ui.yesco.mvc.view.driveRecord.fragment.DetailDialog',
              controller: this,
            }).then(function (oDialog) {
              oView.addDependent(oDialog);
              return oDialog;
            });
          }

          this._pDetailDialog.then(async function (oDialog) {
            oViewModel.setProperty('/dialog', mRowData);
            oDialog.open();
          });
        }, 100);
      },

      // Dialog Close
      onDialogClose(oEvent) {
        oEvent.getSource().getParent().close();
      },

      checkError() {
        const oViewModel = this.getViewModel();
        const mDialogData = oViewModel.getProperty('/dialog');

        if (!mDialogData.Drvkm || mDialogData.Drvkm === '0') {
          // 주행거리를 입력하세요.
          MessageBox.alert(this.getBundleText('MSG_33001'));
          return true;
        }

        if (_.parseInt(mDialogData.Endkm) <= _.parseInt(mDialogData.Begkm)) {
          // 주행 후 거리는 주행 전 거리보다 큰 값으로 입력하세요.
          MessageBox.alert(this.getBundleText('MSG_33002'));
          return true;
        }

        return false;
      },

      // 등록
      onRegistBtn() {
        if (this.checkError()) return;

        // {등록}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00106'), {
          // 등록, 취소
          actions: [this.getBundleText('LABEL_00106'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            // 등록
            if (!vPress || vPress !== this.getBundleText('LABEL_00106')) {
              return;
            }

            const oViewModel = this.getViewModel();

            try {
              AppUtils.setAppBusy(true, this);

              const mDialogData = oViewModel.getProperty('/dialog');
              let oSendObject = {
                ...mDialogData,
                Prcty: 'C',
              };

              const oModel = this.getModel(ServiceNames.BENEFIT);

              await Client.create(oModel, 'DrivingRecordAppl', oSendObject);

              // {등록}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00106'), {
                onClose: () => {
                  this.onNavBack();
                },
              });
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              AppUtils.setAppBusy(false, this);
            }
          },
        });
      },

      // 삭제
      onDeleteBtn() {
        // {삭제}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00110'), {
          // 삭제, 취소
          actions: [this.getBundleText('LABEL_00110'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            // 삭제
            if (!vPress || vPress !== this.getBundleText('LABEL_00110')) {
              return;
            }

            AppUtils.setAppBusy(true, this);

            try {
              const oViewModel = this.getViewModel();
              const oModel = this.getModel(ServiceNames.BENEFIT);

              await Client.remove(oModel, 'DrivingRecordAppl', { Seqnr: oViewModel.getProperty('/dialog/Seqnr') });

              // {삭제}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00110'), {
                onClose: () => {
                  this.onNavBack();
                },
              });
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              AppUtils.setAppBusy(false, this);
            }
          },
        });
      },

      onPressExcelDownload() {
        const oTable = this.byId(this.DRIVE_TABLE_ID);
        const aTableData = this.getViewModel().getProperty('/List');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_34001'); // {차량운행기록부}_목록

        TableUtils.export({ oTable, aTableData, sFileName });
      },
    });
  }
);