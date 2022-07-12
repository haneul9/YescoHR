sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    Client,
    ServiceNames,
    MessageBox,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.driveRecord.DriveRecord', {
      DRIVE_TABLE_ID: 'driveTable',

      initializeModel() {
        return {
          busy: false,
          search: {
            Zyymm: moment().format('YYYYMM'),
          },
          Total: {},
          list: [],
          listInfo: {
            rowCount: 1,
            totalCount: 0,
            progressCount: 0,
            applyCount: 0,
            approveCount: 0,
            rejectCount: 0,
            completeCount: 0,
            visibleStatus: 'X',
            Title: this.getBundleText('LABEL_34005'), // 운행기록
            infoMessage: this.getBundleText('MSG_34002'),
          },
        };
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          this.retrieveTotalDriveRecord();
          this.retrieveMonthlyDriveRecord();
        } catch (oError) {
          this.debug('Controller > driveRecord App > onObjectMatched Error', oError);

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

          this.retrieveTotalDriveRecord();
          this.retrieveMonthlyDriveRecord();
        } catch (oError) {
          this.debug('Controller > driveRecord App > callbackAppointeeChange Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      onChangeMileageFormat(oEvent) {
        const oEventSource = oEvent.getSource();
        const sPath = oEventSource.getBinding('value').getPath();
        const sValue = oEvent.getParameter('value').trim().replace(/[^\d]/g, '');

        oEventSource.setValue(this.TextUtils.toCurrency(sValue));
        oEventSource.getModel().setProperty(sPath, sValue);
      },

      onPressSave() {
        AppUtils.setAppBusy(true);

        // {저장}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
          actions: [this.getBundleText('LABEL_00103'), MessageBox.Action.CANCEL],
          onClose: (sAction) => {
            if (!sAction || sAction === MessageBox.Action.CANCEL) {
              AppUtils.setAppBusy(false);
              return;
            }

            this.createProcess();
          },
        });
      },

      async onSearch() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          this.retrieveTotalDriveRecord();
          this.retrieveMonthlyDriveRecord();
        } catch (oError) {
          this.debug('Controller > driveRecord App > onSearch Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      onPressExcelDownload() {
        const oTable = this.byId(this.DRIVE_TABLE_ID);
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_34001'); // {차량운행기록부}_목록
        const aTableData = _.cloneDeep(this.getViewModel().getProperty('/list'));

        this.TableUtils.export({
          oTable,
          sFileName,
          aTableData: _.map(aTableData, (o) => ({
            ...o,
            Drvkma: this.TextUtils.toCurrency(o.Drvkma),
            Drvkmb: this.TextUtils.toCurrency(o.Drvkmb),
            Drvkm: this.TextUtils.toCurrency(o.Drvkm),
            Begkm: this.TextUtils.toCurrency(o.Begkm),
            Endkm: this.TextUtils.toCurrency(o.Endkm),
          })),
        });
      },

      // 차량운행기록부 현황
      async retrieveTotalDriveRecord() {
        const oViewModel = this.getViewModel();

        try {
          const oModel = this.getModel(ServiceNames.BENEFIT);
          const [mMyDriveRecord] = await Client.getEntitySet(oModel, 'DrivingRecordMain', { Pernr: this.getAppointeeProperty('Pernr') });

          oViewModel.setProperty('/Total', _.omit(mMyDriveRecord, '__metadata'));
        } catch (oError) {
          throw oError;
        }
      },

      // 운행기록
      async retrieveMonthlyDriveRecord() {
        const oViewModel = this.getViewModel();

        try {
          const oModel = this.getModel(ServiceNames.BENEFIT);
          const oTable = this.byId(this.DRIVE_TABLE_ID);
          const sZyymm = this.getViewModel().getProperty('/search/Zyymm');
          const aRowData = await Client.getEntitySet(oModel, 'DrivingRecordAppl', {
            Menid: this.getCurrentMenuId(),
            Pernr: this.getAppointeeProperty('Pernr'),
            Zyymm: sZyymm,
          });

          // @TEST code
          // this.getTempArray().forEach((o) => aRowData.push(o));

          const oListInfo = oViewModel.getProperty('/listInfo');

          oViewModel.setProperty('/listInfo', {
            ...oListInfo,
            ...this.TableUtils.count({ oTable, aRowData }),
          });
          oViewModel.setProperty(
            '/list',
            _.map(aRowData, (o) => _.omit(o, ['__metadata', 'DrivingRecordNav']))
          );
        } catch (oError) {
          throw oError;
        }
      },

      async createProcess() {
        const oViewModel = this.getViewModel();

        try {
          await Client.deep(this.getModel(ServiceNames.BENEFIT), 'DrivingRecordAppl', {
            Menid: this.getCurrentMenuId(),
            Pernr: this.getAppointeeProperty('Pernr'),
            Zyymm: oViewModel.getProperty('/search/Zyymm'),
            DrivingRecordNav: _.cloneDeep(oViewModel.getProperty('/list')),
          });

          // {저장}되었습니다.
          MessageBox.success(this.getBundleText('MSG_00007', 'LABEL_00103'), {
            onClose: () => this.onSearch(),
          });
        } catch (oError) {
          this.debug('Controller > driveRecord Detail > createProcess Error', oError);

          AppUtils.handleError(oError);
        } finally {
          AppUtils.setAppBusy(false);
        }
      },

      getTempArray() {
        const sZyymm = this.getViewModel().getProperty('/search/Zyymm');
        const aWeekday = ['일', '월', '화', '수', '목', '금', '토'];

        return Array.from({ length: moment(sZyymm).daysInMonth() }, (x, i) => {
          const dCurDate = moment(sZyymm).startOf('month').add(i, 'days');
          return {
            Datum: dCurDate.toDate(), //
            Offyn: dCurDate.day() % 6 === 0 ? 'X' : '',
            Daytx: aWeekday[dCurDate.day()],
            Carno: '12가 3456',
            Drvkma: null,
            Drvkmb: null,
            Drvkm: '20.00',
            Begkm: '10000.00',
            Endkm: '10020.00',
          };
        });
      },
    });
  }
);
