sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
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
      TableUtils: TableUtils,
      TextUtils: TextUtils,

      initializeModel() {
        return {
          busy: false,
          Data: [],
          UseList: [
            { Zcode: 'A', Ztext: this.getBundleText('LABEL_34013') }, // 출퇴근
            { Zcode: 'B', Ztext: this.getBundleText('LABEL_34014') }, // 업무
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

      registTimeFormat(date, time) {
        return date && time ? `${moment(date).format('YYYY.MM.DD')} / ${moment(time.ms).subtract(9, 'h').format('HH:mm')}` : '';
      },

      // 총 주행거리
      totalMileage(value = '') {
        if (!value) {
          return;
        }

        return `${this.TextUtils.toCurrency(parseFloat(_.replace(_.replace(value, ' km', ''), ',', '')))} km`;
      },

      // 주행거리
      mileage(value = '') {
        if (!value) {
          return;
        }

        if (_.includes(value, '.')) {
          const sReVal = value.replace(/['.']{3}/g, '.');
          const iIndex = sReVal.indexOf('.');

          value = this.TextUtils.toCurrency(sReVal.split('.')[0].slice(0, 11)) + sReVal.slice(iIndex, iIndex + 4);
        } else {
          value = this.TextUtils.toCurrency(value.slice(0, 11));
        }

        return value;
      },

      // 주행거리
      getMileage(oEvent) {
        const oDetailModel = this.getViewModel();
        const sPath = oEvent.getSource().getBinding('value').getPath();
        let sValue = oEvent
          .getParameter('value')
          .trim()
          .replace(/[^\d'.']/g, '');
        const sPropVal = _.clone(sValue);

        if (_.includes(sValue, '.')) {
          const sReVal = sValue.replace(/['.']{3}/g, '.');
          const iIndex = sReVal.indexOf('.');

          sValue = this.TextUtils.toCurrency(sReVal.split('.')[0].slice(0, 11)) + sReVal.slice(iIndex, iIndex + 4);
        } else {
          sValue = this.TextUtils.toCurrency(sValue.slice(0, 11));
        }

        // oEvent.getSource().setMaxLength(6);
        oDetailModel.setProperty(sPath, sPropVal);
        oEvent.getSource().setValue(sValue);
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

          oViewModel.setProperty('/listInfo', {
            ...TableUtils.count({ oTable, aRowData: aTableList }),
            visibleStatus: 'X',
            Title: this.getBundleText('LABEL_34005'), // 운행기록
          });
          oViewModel.setProperty(
            '/List',
            _.map(aTableList, (e) => {
              return { ...e, Endkm: _.toString(_.add(parseFloat(e.Begkm), parseFloat(e.Drvkm))), Begkm: _.toString(parseFloat(e.Begkm)), Drvkm: _.toString(parseFloat(e.Drvkm)) };
            })
          );
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 대상자 정보 사원선택시 화면 Refresh
      async callbackAppointeeChange() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);
          oViewModel.setProperty('/FieldLimit', _.assignIn(this.getEntityLimit(ServiceNames.BENEFIT, 'DrivingRecordAppl')));

          const [mMyDriveRecord] = await this.getMyRecord();

          oViewModel.setProperty('/Total', mMyDriveRecord);

          const aTableList = await this.getFriveRecord();
          const oTable = this.byId(this.DRIVE_TABLE_ID);

          oViewModel.setProperty('/listInfo', {
            ...TableUtils.count({ oTable, aRowData: aTableList }),
            visibleStatus: 'X',
            Title: this.getBundleText('LABEL_34005'), // 운행기록
          });
          oViewModel.setProperty(
            '/List',
            _.map(aTableList, (e) => {
              return { ...e, Endkm: _.toString(_.add(parseFloat(e.Begkm), parseFloat(e.Drvkm))), Begkm: _.toString(parseFloat(e.Begkm)), Drvkm: _.toString(parseFloat(e.Drvkm)) };
            })
          );
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
          Carno: oViewModel.getProperty('/Total/Carno'),
          Regpr: mAppointee.Pernr,
          RegprZzjikgb: `${mAppointee.Ename} ${mAppointee.Zzjikgbt}`,
        });
      },

      async onSearch() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const [mMyDriveRecord] = await this.getMyRecord();

          oViewModel.setProperty('/Total', mMyDriveRecord);

          const aTableList = await this.getFriveRecord();
          const oTable = this.byId(this.DRIVE_TABLE_ID);

          oViewModel.setProperty('/listInfo', {
            ...TableUtils.count({ oTable, aRowData: aTableList }),
            visibleStatus: 'X',
            Title: this.getBundleText('LABEL_34005'), // 운행기록
          });
          oViewModel.setProperty(
            '/List',
            _.map(aTableList, (e) => {
              return { ...e, Endkm: _.toString(_.add(parseFloat(e.Begkm), parseFloat(e.Drvkm))), Begkm: _.toString(parseFloat(e.Begkm)), Drvkm: _.toString(parseFloat(e.Drvkm)) };
            })
          );
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

          this._pDetailDialog.then(function (oDialog) {
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
          MessageBox.alert(this.getBundleText('MSG_34001'));
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
              AppUtils.setAppBusy(true);

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
                  this.byId('detailDialog').close();
                  this.onSearch();
                },
              });
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              AppUtils.setAppBusy(false);
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

            AppUtils.setAppBusy(true);

            try {
              const oViewModel = this.getViewModel();
              const oModel = this.getModel(ServiceNames.BENEFIT);

              // await Client.remove(oModel, 'DrivingRecordAppl', { Seqnr: oViewModel.getProperty('/dialog/Seqnr') });
              const mDialogData = oViewModel.getProperty('/dialog');
              let oSendObject = {
                ...mDialogData,
                Prcty: 'X',
              };

              await Client.create(oModel, 'DrivingRecordAppl', oSendObject);

              // {삭제}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00110'), {
                onClose: () => {
                  this.byId('detailDialog').close();
                  this.onSearch();
                },
              });
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              AppUtils.setAppBusy(false);
            }
          },
        });
      },

      onPressExcelDownload() {
        const oTable = this.byId(this.DRIVE_TABLE_ID);
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_34001'); // {차량운행기록부}_목록

        TableUtils.export({ oTable, sFileName });
      },
    });
  }
);
