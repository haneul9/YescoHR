/* eslint-disable no-else-return */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    MessageBox,
    Client,
    UI5Error,
    Appno,
    AppUtils,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.excavation.Detail', {
      APPTP: 'HR06',
      sRouteName: '',

      getPreviousRouteName() {
        return this.getViewModel().getProperty('/previousName');
      },

      initializeModel() {
        return {
          busy: false,
          previousName: '',
          Appno: null,
          ZappStatAl: null,
          form: {
            hasRow: false,
            rowCount: 1,
            listMode: 'MultiToggle',
            Chgrsn: '',
            list: [],
            employees: [],
          },
          dialog: {
            busy: false,
            isActiveApproval: false,
            rowCount: 1,
            mode: 'C',
            listMode: 'MultiToggle',
            yearMonth: '',
            list: [],
            selectedData: [],
          },
          ApplyInfo: {},
          ApprovalDetails: {},
        };
      },

      onBeforeShow() {
        this.TableUtils.adjustRowSpan({
          oTable: this.byId('approvalTable'),
          aColIndices: [0, 1, 2],
          sTheadOrTbody: 'thead',
        });
      },

      async onObjectMatched(oParameter, sRouteName) {
        const oViewModel = this.getView().getModel();

        oViewModel.setSizeLimit(10000);
        oViewModel.setData(this.initializeModel());
        oViewModel.setProperty('/Appno', oParameter.appno === 'n' ? null : oParameter.appno);
        oViewModel.setProperty('/previousName', _.chain(sRouteName).split('-', 1).head().value());

        this.loadPage();
      },

      getCurrentLocationText(oArguments) {
        const sAction = oArguments.appno === 'n' ? this.getBundleText('LABEL_00121') : this.getBundleText('LABEL_00100'); // 신청,조회

        return sAction;
      },

      async loadPage() {
        const oView = this.getView();
        const oViewModel = oView.getModel();
        const sAppno = oViewModel.getProperty('/Appno');

        oViewModel.setProperty('/busy', true);

        try {
          if (sAppno) {
            const oModel = this.getModel(ServiceNames.WORKTIME);
            const aDetailData = await Client.getEntitySet(oModel, 'DrillChangeApp', { Appno: sAppno });
            const mDetail = aDetailData[0] ?? {};

            oViewModel.setProperty('/ZappStatAl', mDetail.ZappStatAl);
            oViewModel.setProperty('/form/Chgrsn', mDetail.Chgrsn);
            oViewModel.setProperty('/form/listMode', 'None');

            this.setTableData({ oViewModel, aRowData: [...aDetailData] });
            this.initializeApplyInfoBox(mDetail);
            this.initializeApprovalBox(mDetail);
          } else {
            this.initializeApplyInfoBox();
          }

          this.initializeAttachBox();
        } catch (oError) {
          this.debug('Controller > excavation Detail > loadPage Error', oError);

          if (oError instanceof Error) oError = new UI5Error({ message: this.getBundleText('MSG_00043') }); // 잘못된 접근입니다.

          AppUtils.handleError(oError, {
            onClose: () => this.getRouter().navTo(oViewModel.getProperty('/previousName')),
          });
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      setTableData({ oViewModel, aRowData }) {
        oViewModel.setProperty('/form/rowCount', aRowData.length || 1);
        oViewModel.setProperty('/form/list', aRowData);

        this.toggleHasRowProperty();
      },

      initializeApplyInfoBox(detailData) {
        const oViewModel = this.getViewModel();

        if (_.isEmpty(detailData)) {
          const mSessionData = this.getAppointeeData();

          oViewModel.setProperty('/ApplyInfo', {
            Apename: mSessionData.Ename,
            Aporgtx: `${mSessionData.Btrtx} / ${mSessionData.Orgtx}`,
            Apjikgbtl: `${mSessionData.Zzjikgbt} / ${mSessionData.Zzjikcht}`,
          });
        } else {
          oViewModel.setProperty('/ApplyInfo', { ...detailData });
        }
      },

      initializeApprovalBox(detailData) {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/ApprovalDetails', { ...detailData });
      },

      initializeAttachBox() {
        const oViewModel = this.getViewModel();
        const sStatus = oViewModel.getProperty('/ZappStatAl');
        const sAppno = oViewModel.getProperty('/Appno') || '';

        this.AttachFileAction.setAttachFile(this, {
          Editable: !sStatus,
          Type: this.APPTP,
          Appno: sAppno,
          Max: 10,
          // FileTypes: 'jpg,jpeg,pdf,doc,docx,ppt,pptx,xls,xlsx,bmp,png'.split(','),
        });
      },

      async openFormDialog() {
        const oView = this.getView();
        const oViewModel = this.getViewModel();

        AppUtils.setAppBusy(true);

        if (!this.pDrillDialog) {
          this.pDrillDialog = await Fragment.load({
            id: oView.getId(),
            name: 'sap.ui.yesco.mvc.view.excavation.fragment.DialogTable',
            controller: this,
          });

          this.pDrillDialog.attachBeforeOpen(async () => {
            const aEmployeeList = oViewModel.getProperty('/form/employees');

            if (_.isEmpty(aEmployeeList)) {
              const oModel = this.getModel(ServiceNames.COMMON);
              const aEmployees = await Client.getEntitySet(oModel, 'EmpSearchResult', {
                Menid: this.getCurrentMenuId(),
                Persa: this.getAppointeeProperty('Werks'),
                Stat2: '3',
                Zflag: 'X',
                Actda: moment().hour(9).toDate(),
              });

              oViewModel.setProperty(
                '/form/employees',
                aEmployees.map((o) => ({ ..._.pick(o, ['Ename', 'Fulln', 'Zzjikgbt']), Pernr: _.trimStart(o.Pernr, '0') }))
              );
            }
          });

          oView.addDependent(this.pDrillDialog);
        }

        this.pDrillDialog.open();
      },

      toggleHasRowProperty() {
        const oViewModel = this.getViewModel();
        const aTableData = oViewModel.getProperty('/form/list');

        oViewModel.setProperty('/form/hasRow', !!aTableData.length);
      },

      async createProcess({ sPrcty = 'C' }) {
        const oViewModel = this.getViewModel();
        const iAttachLength = this.AttachFileAction.getFileCount.call(this);
        let sAppno = oViewModel.getProperty('/Appno');

        try {
          if (!sAppno) {
            sAppno = await Appno.get();
            oViewModel.setProperty('/Appno', sAppno);
          }

          if (iAttachLength > 0) {
            await this.AttachFileAction.uploadFile.call(this, sAppno, this.APPTP);
          }

          const oModel = this.getModel(ServiceNames.WORKTIME);
          const aTableData = oViewModel.getProperty('/form/list');
          const sChgrsn = oViewModel.getProperty('/form/Chgrsn');

          await Client.deep(oModel, 'DrillChangeApp', {
            Menid: this.getCurrentMenuId(),
            Pernr: this.getAppointeeProperty('Pernr'),
            Appno: sAppno,
            Prcty: sPrcty,
            Chgrsn: sChgrsn,
            DrillChangeNav: [...aTableData.map((o) => ({ ...o, Chgrsn: sChgrsn }))],
          });

          // {신청}되었습니다.
          MessageBox.success(this.getBundleText('MSG_00007', this.getBundleText('LABEL_00121')), {
            onClose: () => this.getRouter().navTo(oViewModel.getProperty('/previousName')),
          });
        } catch (oError) {
          this.debug('Controller > excavation Detail > createProcess Error', oError);

          AppUtils.handleError(oError);
        } finally {
          AppUtils.setAppBusy(false);
        }
      },

      async retrieveCurrentDuty() {
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const oViewModel = this.getViewModel();
        const aList = oViewModel.getProperty('/form/list');
        const sMode = oViewModel.getProperty('/dialog/mode');
        const sYearMonth = oViewModel.getProperty('/dialog/yearMonth');

        try {
          oViewModel.setProperty('/dialog/busy', true);

          const sPernr = this.getAppointeeProperty('Pernr');
          let aOverviewList = await Client.getEntitySet(oModel, 'DrillList', {
            Prcty: sMode,
            Zyymm: sYearMonth,
            Pernr: _.chain(aList)
              .reduce((acc, cur) => [...acc, _.get(cur, 'PernrA'), _.get(cur, 'PernrB')], [sPernr])
              .uniq()
              .value(),
          });

          aOverviewList = _.differenceWith(aOverviewList, aList, (a, b) => moment(a.Datum).format('YYYYMMDD') === moment(b.Datum).format('YYYYMMDD'));

          const iRowCount = aOverviewList.length || 1;
          oViewModel.setProperty('/dialog/list', [...aOverviewList]);
          oViewModel.setProperty('/dialog/rowCount', iRowCount > 10 ? 10 : iRowCount);
        } catch (oError) {
          this.debug('Controller > excavation Detail > retrieveCurrentDuty Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/dialog/busy', false);
        }
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      async onPressAddBtn() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/dialog/yearMonth', moment().format('YYYYMM'));
        this.retrieveCurrentDuty();

        this.openFormDialog();
      },

      onPressDelBtn() {
        const oViewModel = this.getViewModel();
        const oTable = this.byId('approvalTable');
        const aSelectedIndices = oTable.getSelectedIndices();
        const aTableData = oViewModel.getProperty('/form/list');

        if (aSelectedIndices.length < 1) {
          MessageBox.alert(this.getBundleText('MSG_00020', 'LABEL_00110')); // {삭제}할 행을 선택하세요.
          return;
        }

        // 선택된 행을 삭제하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00021'), {
          onClose: function (sAction) {
            if (MessageBox.Action.CANCEL === sAction) return;

            const aUnSelectedData = aTableData.filter((elem, idx) => {
              return !aSelectedIndices.some(function (iIndex) {
                return iIndex === idx;
              });
            });

            oViewModel.setProperty('/form/list', aUnSelectedData);
            oViewModel.setProperty('/form/rowCount', aUnSelectedData.length || 1);

            this.toggleHasRowProperty();
            oTable.clearSelection();
          }.bind(this),
        });
      },

      onSelectSuggest(oEvent) {
        const oInput = oEvent.getSource();
        const oSelectedSuggestionRow = oEvent.getParameter('selectedRow');
        if (oSelectedSuggestionRow) {
          const oContext = oSelectedSuggestionRow.getBindingContext();
          oInput.setValue(oContext.getProperty('Pernr'));

          const sRowPath = oInput.getParent().getBindingContext().getPath();
          const oViewModel = this.getViewModel();
          oViewModel.setProperty(`${sRowPath}/EnameA`, oContext.getProperty('Ename'));
          oViewModel.setProperty(`${sRowPath}/OrgtxA`, oContext.getProperty('Fulln'));
          oViewModel.setProperty(`${sRowPath}/ZzjikgbtA`, oContext.getProperty('Zzjikgbt'));
        }
        oInput.getBinding('suggestionRows').filter([]);
      },

      onSubmitSuggest(oEvent) {
        const oViewModel = this.getViewModel();
        const oInput = oEvent.getSource();
        const oContext = oInput.getParent().getBindingContext();
        const sRowPath = oContext.getPath();

        const sInputValue = oEvent.getParameter('value');
        if (!sInputValue) {
          oViewModel.setProperty(`${sRowPath}/PernrA`, '');
          oViewModel.setProperty(`${sRowPath}/EnameA`, '');
          oViewModel.setProperty(`${sRowPath}/OrgtxA`, '');
          oViewModel.setProperty(`${sRowPath}/ZzjikgbtA`, '');
          return;
        }

        const aEmployees = oViewModel.getProperty('/form/employees');
        const [mEmployee] = _.filter(aEmployees, (o) => _.startsWith(o.Pernr, sInputValue.replace(/0+/, '')));

        if (sRowPath && !_.isEmpty(mEmployee)) {
          oViewModel.setProperty(`${sRowPath}/PernrA`, mEmployee.Pernr);
          oViewModel.setProperty(`${sRowPath}/EnameA`, mEmployee.Ename);
          oViewModel.setProperty(`${sRowPath}/OrgtxA`, mEmployee.Fulln);
          oViewModel.setProperty(`${sRowPath}/ZzjikgbtA`, mEmployee.Zzjikgbt);
        } else {
          oViewModel.setProperty(`${sRowPath}/PernrA`, '');
          oViewModel.setProperty(`${sRowPath}/EnameA`, '');
          oViewModel.setProperty(`${sRowPath}/OrgtxA`, '');
          oViewModel.setProperty(`${sRowPath}/ZzjikgbtA`, '');
        }
      },

      async onChangeDialogSearch() {
        this.retrieveCurrentDuty();
      },

      onChangeRowSelection(oEvent) {
        const oTable = oEvent.getSource();
        const oViewModel = this.getViewModel();
        const aSelectedIndices = oTable.getSelectedIndices();

        oViewModel.setProperty('/dialog/isActiveApproval', !!aSelectedIndices.length);
        oViewModel.setProperty(
          '/dialog/selectedData',
          aSelectedIndices.map((idx) => oViewModel.getProperty(`/dialog/list/${idx}`))
        );
      },

      onPressAddData(oEvent) {
        const oViewModel = this.getViewModel();
        const aSelectedData = oViewModel.getProperty('/dialog/selectedData');
        const aList = oViewModel.getProperty('/form/list');

        oViewModel.setProperty('/form/list', []);

        _.forEach(aSelectedData, (o) =>
          aList.push({
            Datum: o.Datum,
            Kurzt: o.Kurzt,
            Tagty: o.Tagty,
            PernrB: o.Pernr,
            EnameB: o.Ename,
            OrgtxB: o.Orgtx,
            ZzjikgbtB: o.Zzjikgbt,
          })
        );

        if (aList.length === 2) {
          _.chain(aList[1]).set('PernrA', aList[0].PernrB).set('EnameA', aList[0].EnameB).set('OrgtxA', aList[0].OrgtxB).set('ZzjikgbtA', aList[0].ZzjikgbtB).commit();
        }

        oViewModel.setProperty('/form/rowCount', aList.length || 1);
        oViewModel.setProperty('/form/list', aList);
        oViewModel.setProperty('/dialog/selectedData', []);

        this.toggleHasRowProperty();
        this.onPressOverviewDialogClose(oEvent);
      },

      onPressOverviewExcelDownload() {
        const oTable = this.byId('overviewDialogTable');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_11005'); // {통합굴착야간근무현황}_목록

        this.TableUtils.export({ oTable, sFileName });
      },

      onPressOverviewDialogClose(oEvent) {
        AppUtils.setAppBusy(false);

        oEvent.getSource().getParent().getContent()[1].getItems()[0].clearSelection();
        this.byId('overviewDialog').close();
      },

      onPressApproval() {
        const oViewModel = this.getViewModel();
        const sPrcty = 'C';
        const aList = oViewModel.getProperty('/form/list');
        const sChgrsn = oViewModel.getProperty('/form/Chgrsn');

        if (!sChgrsn) {
          MessageBox.alert(this.getBundleText('MSG_00003', 'LABEL_04013')); // {변경사유}를 입력하세요.
          return;
        }

        if (!_.some(aList, 'PernrA')) {
          MessageBox.alert(this.getBundleText('MSG_00005', 'LABEL_11006')); // {근무자}를 선택하세요.
          return;
        }

        AppUtils.setAppBusy(true);

        // {신청}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00121'), {
          actions: [this.getBundleText('LABEL_00121'), MessageBox.Action.CANCEL],
          onClose: (sAction) => {
            if (!sAction || sAction === MessageBox.Action.CANCEL) {
              AppUtils.setAppBusy(false);
              return;
            }

            this.createProcess({ sPrcty });
          },
        });
      },

      /*****************************************************************
       * ! Call OData
       *****************************************************************/
    });
  }
);
