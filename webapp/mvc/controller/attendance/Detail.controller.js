/* eslint-disable no-else-return */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/exceptions/ODataCreateError',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/Validator',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date', // DatePicker 에러 방지 import : Loading of data failed: Error: Date must be a JavaScript date object
  ],
  (
    // prettier 방지용 주석
    Fragment,
    Filter,
    FilterOperator,
    JSONModel,
    MessageBox,
    ComboEntry,
    UI5Error,
    ODataReadError,
    ODataCreateError,
    Appno,
    AppUtils,
    AttachFileAction,
    ServiceNames,
    TableUtils,
    TextUtils,
    Validator,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.attendance.Detail', {
      LIST_PAGE_ID: 'container-ehr---attendanceList',
      TYPE_CODE: 'HR04',
      PAGE_TYPE: { NEW: 'A', CHANGE: 'B', CANCEL: 'C' },
      ACTION_MESSAGE: {
        T: 'LABEL_00104', // 임시저장
        C: 'LABEL_00121', // 신청
      },

      AttachFileAction: AttachFileAction,
      TextUtils: TextUtils,

      onBeforeShow() {
        const oViewModel = new JSONModel({
          busy: false,
          type: this.PAGE_TYPE.NEW,
          Appno: null,
          ZappStatAl: null,
          form: {
            hasRow: false,
            rowCount: 1,
            listMode: 'MultiToggle',
            list: [],
            dialog: {
              calcCompleted: false,
              selectedRowPath: null,
              awartCodeList: new ComboEntry({ codeKey: 'Awart', valueKey: 'Atext' }),
              data: {
                Awart: 'ALL',
              },
            },
          },
          ApplyInfo: {},
          ApprovalDetails: {},
        });
        this.setViewModel(oViewModel);
      },

      onObjectMatched(oParameter) {
        if (!'A,B,C'.split(',').includes(oParameter.type)) {
          this.getRouter().navTo('attendance');
          return;
        }

        if (oParameter.type === this.PAGE_TYPE.CHANGE) {
          // Multiple table generate
          const oTable = this.byId('approveMultipleTable');
          oTable.addEventDelegate(
            {
              onAfterRendering: () => {
                TableUtils.adjustRowSpan({
                  table: oTable,
                  colIndices: [0, 7],
                  theadOrTbody: 'thead',
                });
              },
            },
            oTable
          );
        }

        const oViewModel = this.getView().getModel();
        oViewModel.setProperty('/type', oParameter.type);
        oViewModel.setProperty('/Appno', oParameter.appno);

        this.loadPage();
      },

      getCurrentLocationText(oArguments) {
        const sAction = oArguments.appno ? this.getBundleText('LABEL_00100') : ''; // 조회
        const oNavigationMap = {
          A: this.getBundleText('LABEL_04002'), // 신규신청
          B: this.getBundleText('LABEL_04003'), // 변경신청
          C: this.getBundleText('LABEL_04004'), // 취소신청
        };
        return `${oNavigationMap[oArguments.type]} ${sAction}`;
      },

      async loadPage() {
        const oView = this.getView();
        const oViewModel = oView.getModel();
        const sAppno = oViewModel.getProperty('/Appno');
        const sType = oViewModel.getProperty('/type');

        try {
          if (sAppno) {
            const aRowData = await this.readLeaveApplEmpList({ Prcty: 'R', Appno: sAppno });

            oViewModel.setProperty('/ZappStatAl', aRowData[0].ZappStatAl);
            oViewModel.setProperty('/form/listMode', 'None');

            this.setTableData({ sType, oViewModel, aRowData });
            this.initializeApplyInfoBox(aRowData[0]);
            this.initializeApprovalBox(aRowData[0]);
          } else {
            if (sType === this.PAGE_TYPE.CHANGE || sType === this.PAGE_TYPE.CANCEL) {
              const oListView = oView.getParent().getPage(this.LIST_PAGE_ID);
              const mListSelectedData = oListView.getModel().getProperty('/parameter/rowData');

              if (sType === this.PAGE_TYPE.CANCEL) {
                oViewModel.setProperty('/form/listMode', 'None');
              } else {
                mListSelectedData.forEach((o) => (o.Tmrsn = ''));
              }

              // 변경|취소 신청의 경우 List페이지에서 선택된 데이터를 가져온다.
              this.setTableData({ sType, oViewModel, aRowData: mListSelectedData });
            }

            this.initializeApplyInfoBox();
          }

          this.initializeAttachBox();
        } catch (oError) {
          this.debug('Controller > Attendance Detail > onAfterShow Error', oError);

          if (oError instanceof Error) oError = new UI5Error({ message: this.getBundleText('MSG_00043') }); // 잘못된 접근입니다.

          AppUtils.handleError(oError, {
            onClose: () => this.getRouter().navTo('attendance'),
          });
        }
      },

      setTableData({ sType, oViewModel, aRowData }) {
        oViewModel.setProperty('/form/rowCount', aRowData.length);
        oViewModel.setProperty(
          '/form/list',
          aRowData.map((o) => {
            if (sType === this.PAGE_TYPE.CHANGE) {
              return {
                ...o,
                isChanged: false,
                Abrtg2: o.Abrtg2 ? o.Abrtg2 : o.Abrtg,
                AbrtgTxt: Number(o.Abrtg),
                AbrtgTxt2: o.Abrtg2 ? Number(o.Abrtg2) : Number(o.Abrtg),
                Abrst2: o.Abrst2 ? o.Abrst2 : o.Abrst,
                Begda2: o.Begda2 ? o.Begda2 : o.Begda,
                Endda2: o.Endda2 ? o.Endda2 : o.Endda,
                BegdaTxt: o.Begda ? moment(o.Begda).hours(9).format('YYYY.MM.DD') : '',
                EnddaTxt: o.Endda ? moment(o.Endda).hours(9).format('YYYY.MM.DD') : '',
                BegdaTxt2: o.Begda2 ? moment(o.Begda2).hours(9).format('YYYY.MM.DD') : moment(o.Begda).hours(9).format('YYYY.MM.DD'),
                EnddaTxt2: o.Endda2 ? moment(o.Endda2).hours(9).format('YYYY.MM.DD') : moment(o.Endda).hours(9).format('YYYY.MM.DD'),
              };
            } else {
              return {
                ...o,
                AbrtgTxt: `${Number(o.Abrtg)}일`,
                BegdaTxt: moment(o.Begda).hours(9).format('YYYY.MM.DD'),
                EnddaTxt: moment(o.Endda).hours(9).format('YYYY.MM.DD'),
              };
            }
          })
        );

        this.toggleHasRowProperty();
      },

      initializeApplyInfoBox(detailData) {
        const oViewModel = this.getViewModel();

        if (_.isEmpty(detailData)) {
          const oSessionData = this.getSessionData();

          oViewModel.setProperty('/ApplyInfo', {
            Apename: oSessionData.Ename,
            Aporgtx: `${oSessionData.Btrtx}/${oSessionData.Orgtx}`,
            Apjikgbtl: `${oSessionData.Zzjikgbt}/${oSessionData.Zzjiktlt}`,
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
        const sType = oViewModel.getProperty('/type') || '';

        AttachFileAction.setAttachFile(this, {
          Editable: !sStatus,
          Type: this.TYPE_CODE,
          Appno: sAppno,
          Message: this.getBundleText('MSG_00037'), // 증빙자료를 꼭 등록 해주세요.
          Max: 10,
          Visible: !(sType === this.PAGE_TYPE.CANCEL),
          FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'png'],
        });
      },

      async openFormDialog() {
        const oView = this.getView();
        const oViewModel = this.getViewModel();

        AppUtils.setAppBusy(true, this);

        // 근태유형
        try {
          const mAwartCode = await this.readAwartCodeList();
          oViewModel.setProperty('/form/dialog/awartCodeList', mAwartCode);
        } catch (oError) {
          this.debug('Controller > Attendance Detail > readAwartCodeList Error', oError);
        }

        setTimeout(() => {
          if (!this.pFormDialog) {
            this.pFormDialog = Fragment.load({
              id: oView.getId(),
              name: 'sap.ui.yesco.mvc.view.attendance.fragment.FormDialog',
              controller: this,
            }).then(function (oDialog) {
              oView.addDependent(oDialog);
              return oDialog;
            });
          }
          this.pFormDialog.then(function (oDialog) {
            oDialog.open();
          });
        }, 100);
      },

      toggleHasRowProperty() {
        const oViewModel = this.getViewModel();
        const sType = oViewModel.getProperty('/type');
        const mTableData = oViewModel.getProperty('/form/list');

        if (sType === this.PAGE_TYPE.CHANGE) {
          oViewModel.setProperty(
            '/form/hasRow',
            mTableData.some((cur) => cur.isChanged)
          );
        } else {
          oViewModel.setProperty('/form/hasRow', !!mTableData.length);
        }
      },

      async createProcess({ sPrcty = 'C' }) {
        const oViewModel = this.getViewModel();
        const iAttachLength = AttachFileAction.getFileLength.call(this);
        let sAppno = oViewModel.getProperty('/Appno');

        try {
          if (!sAppno) {
            sAppno = await Appno.get();
            oViewModel.setProperty('/Appno', sAppno);
          }

          if (iAttachLength > 0) {
            await AttachFileAction.uploadFile.call(this, sAppno, this.TYPE_CODE);
          }

          await this.createLeaveApplContent(sPrcty);

          // {임시저장|신청}되었습니다.
          MessageBox.success(this.getBundleText('MSG_00007', this.ACTION_MESSAGE[sPrcty]), {
            onClose: () => {
              this.getRouter().navTo('attendance');
            },
          });
        } catch (oError) {
          this.debug('Controller > Attendance Detail > createProcess Error', oError);

          AppUtils.handleError(oError);
        } finally {
          AppUtils.setAppBusy(false, this);
        }
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      onPressAddBtn() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/form/dialog/calcCompleted', false);
        oViewModel.setProperty('/form/dialog/data', { Awart: 'ALL' });

        this.openFormDialog();
      },

      onPressChangeBtn() {
        const oViewModel = this.getViewModel();
        const oTable = this.byId('approveMultipleTable');
        const aSelectedIndices = oTable.getSelectedIndices();
        let sRowPath = null;
        let oRowData = {};

        if (aSelectedIndices.length < 1) {
          MessageBox.alert(this.getBundleText('MSG_00020', 'LABEL_00109')); // {변경}할 행을 선택하세요.
          return;
        } else if (aSelectedIndices.length > 1) {
          MessageBox.alert(this.getBundleText('MSG_00038')); // 하나의 행만 선택하세요.
          return;
        }

        sRowPath = oTable.getRows()[aSelectedIndices[0]].getBindingContext().getPath();
        oRowData = oViewModel.getProperty(sRowPath);

        oViewModel.setProperty('/form/dialog/calcCompleted', false);
        oViewModel.setProperty('/form/dialog/selectedRowPath', sRowPath);
        oViewModel.setProperty('/form/dialog/data', { ...oRowData, AbrtgTxt: `${oRowData.AbrtgTxt}일` });

        this.openFormDialog();
      },

      onPressDelBtn() {
        const oViewModel = this.getViewModel();
        const oTable = this.byId('approveSingleTable');
        const aSelectedIndices = oTable.getSelectedIndices();
        const mTableData = oViewModel.getProperty('/form/list');

        if (aSelectedIndices.length < 1) {
          MessageBox.alert(this.getBundleText('MSG_00020', 'LABEL_00110')); // {삭제}할 행을 선택하세요.
          return;
        }

        // 선택된 행을 삭제하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00021'), {
          onClose: function (oAction) {
            if (MessageBox.Action.OK === oAction) {
              const mUnSelectedData = mTableData.filter((elem, idx) => {
                return !aSelectedIndices.some(function (iIndex) {
                  return iIndex === idx;
                });
              });

              oViewModel.setProperty('/form/list', mUnSelectedData);
              oViewModel.setProperty('/form/rowCount', mUnSelectedData.length);

              this.toggleHasRowProperty();
              oTable.clearSelection();
            }
          }.bind(this),
        });
      },

      onChangeAwartCombo(oEvent) {
        const oViewModel = this.getViewModel();
        const oSelectedValue = oEvent.getSource().getSelectedItem().getText();

        oViewModel.setProperty('/form/dialog/data/Atext', oSelectedValue);
        oViewModel.setProperty('/form/dialog/calcCompleted', false);
        oViewModel.setProperty('/form/dialog/data/Begda', null);
        oViewModel.setProperty('/form/dialog/data/Endda', null);
        oViewModel.setProperty('/form/dialog/data/Abrst', null);
        oViewModel.setProperty('/form/dialog/data/Abrtg', null);
        oViewModel.setProperty('/form/dialog/data/AbrtgTxt', null);
      },

      async onChangeLeaveDate() {
        const oViewModel = this.getViewModel();
        const oFormData = oViewModel.getProperty('/form/dialog/data');

        try {
          const mResult = await this.readLeaveApplEmpList({ ...oFormData, Prcty: 'C' });
          const oResultData = mResult[0];

          if (!_.isEmpty(oResultData)) {
            oViewModel.setProperty('/form/dialog/data/Abrst', oResultData.Abrst);
            oViewModel.setProperty('/form/dialog/data/Abrtg', oResultData.Abrtg);
            oViewModel.setProperty('/form/dialog/data/AbrtgTxt', `${parseInt(oResultData.Abrtg, 10)}일`);
            oViewModel.setProperty('/form/dialog/calcCompleted', true);
          }
        } catch (oError) {
          this.debug('Controller > Attendance Detail > onChangeLeaveDate Error', oError);
        }
      },

      onPressFormDialogClose() {
        AppUtils.setAppBusy(false, this);
        this.byId('formDialog').close();
      },

      onPressFormDialogSave() {
        const oViewModel = this.getViewModel();
        const sType = oViewModel.getProperty('/type');
        const bCalcCompleted = oViewModel.getProperty('/form/dialog/calcCompleted');
        const oInputData = oViewModel.getProperty('/form/dialog/data');
        const mCheckFields = [
          { field: 'Tmrsn', label: this.getBundleText('LABEL_04009'), type: Validator.SELECT2 }, // 근태사유
        ];
        let oTable;

        if (!bCalcCompleted) {
          MessageBox.error(this.getBundleText('MSG_04001')); // 계산이 수행되지 않아 저장이 불가합니다.
          return;
        }

        if (!Validator.check({ mFieldValue: oInputData, aFieldProperties: mCheckFields })) return;

        if (sType === this.PAGE_TYPE.CHANGE) {
          const sRowPath = oViewModel.getProperty('/form/dialog/selectedRowPath');
          const oRowData = oViewModel.getProperty(sRowPath);
          const oChangedData = {
            ...oRowData,
            ...oInputData,
            isChanged: true,
            AbrtgTxt: Number(oInputData.Abrtg),
            Begda: moment(oInputData.Begda).hours(9).toDate(),
            Endda: moment(oInputData.Endda).hours(9).toDate(),
            BegdaTxt: moment(oInputData.Begda).hours(9).format('YYYY.MM.DD'),
            EnddaTxt: moment(oInputData.Endda).hours(9).format('YYYY.MM.DD'),
            Tmrsn: oInputData.Tmrsn,
          };
          oTable = this.byId('approveMultipleTable');

          if (oRowData.BegdaTxt2 === oChangedData.BegdaTxt && oRowData.EnddaTxt2 === oChangedData.EnddaTxt) {
            MessageBox.error(this.getBundleText('MSG_04002')); // 변경된 데이터가 없습니다.
            return;
          }

          oViewModel.setProperty(sRowPath, oChangedData);
        } else {
          const mListData = oViewModel.getProperty('/form/list');
          oTable = this.byId('approveSingleTable');

          mListData.push({
            ...oInputData,
            Begda: moment(oInputData.Begda).hours(9).toDate(),
            Endda: moment(oInputData.Endda).hours(9).toDate(),
            BegdaTxt: moment(oInputData.Begda).hours(9).format('YYYY.MM.DD'),
            EnddaTxt: moment(oInputData.Endda).hours(9).format('YYYY.MM.DD'),
          });

          oViewModel.setProperty('/form/list', mListData);
          oViewModel.setProperty('/form/rowCount', mListData.length);
        }

        oTable.clearSelection();
        this.toggleHasRowProperty();

        AppUtils.setAppBusy(false, this);
        this.byId('formDialog').close();
      },

      onPressApproval() {
        AppUtils.setAppBusy(true, this);

        const sPrcty = 'C';

        // {신청}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00121'), {
          actions: [this.getBundleText('LABEL_00121'), MessageBox.Action.CANCEL],
          onClose: (sAction) => {
            if (!sAction || sAction === MessageBox.Action.CANCEL) {
              AppUtils.setAppBusy(false, this);
              return;
            }

            this.createProcess({ sPrcty });
          },
        });
      },

      /*****************************************************************
       * ! Call OData
       *****************************************************************/
      readAwartCodeList() {
        return new Promise((resolve, reject) => {
          const oModel = this.getModel(ServiceNames.WORKTIME);
          const oViewModel = this.getViewModel();
          const sUrl = '/AwartCodeListSet';
          const mAwartCodeList = oViewModel.getProperty('/form/dialog/awartCodeList');

          if (mAwartCodeList.length > 1) {
            resolve(mAwartCodeList);
          }

          oModel.read(sUrl, {
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(new ComboEntry({ codeKey: 'Awart', valueKey: 'Atext', mEntries: oData.results }));
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      },

      /**
       *
       * @param {String} Prcty - R: 상세조회, C: 계산
       * @returns
       */
      readLeaveApplEmpList({ Awart, Begda, Endda, Prcty, Appno }) {
        return new Promise((resolve, reject) => {
          const oModel = this.getModel(ServiceNames.WORKTIME);
          const sUrl = '/LeaveApplEmpListSet';
          let aFilters = [new Filter('Prcty', FilterOperator.EQ, Prcty)];

          if (Prcty === 'C') {
            aFilters = [
              ...aFilters, //
              new Filter('Awart', FilterOperator.EQ, Awart),
              new Filter('Begda', FilterOperator.EQ, moment(Begda).hour(9).toDate()),
              new Filter('Endda', FilterOperator.EQ, moment(Endda).hour(9).toDate()),
            ];
          } else if (Prcty === 'R') {
            aFilters = [
              ...aFilters, //
              new Filter('Appno', FilterOperator.EQ, Appno),
            ];
          }

          oModel.read(sUrl, {
            filters: aFilters,
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(oData.results);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      },

      /**
       *
       * @param {String} sPrcty -  T:임시저장, C:신청
       * @returns
       */
      createLeaveApplContent(sPrcty) {
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const oViewModel = this.getViewModel();
        const oTargetInfo = this.getOwnerComponent().getTargetModel().getData();
        const mTableData = oViewModel.getProperty('/form/list');
        const sAppty = oViewModel.getProperty('/type');
        const sAppno = oViewModel.getProperty('/Appno');
        const sMenid = this.getCurrentMenuId();
        const sUrl = '/LeaveApplContentSet';
        let aLeaveApplNav1 = [...mTableData];

        return new Promise((resolve, reject) => {
          if (sAppty === this.PAGE_TYPE.CHANGE) {
            aLeaveApplNav1 = aLeaveApplNav1.filter((o) => o.isChanged === true);
          }

          const oPayload = {
            Menid: sMenid,
            Pernr: oTargetInfo.Pernr,
            Orgeh: oTargetInfo.Orgeh,
            Appno: sAppno,
            Prcty: sPrcty,
            Appty: sAppty, // A:신규, B:변경, C:취소
            LeaveApplNav1: aLeaveApplNav1.map((o) => ({ ...o, Pernr: oTargetInfo.Pernr })),
          };

          oModel.create(sUrl, oPayload, {
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(oData.results);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, AppUtils.parseError(oError));

              reject(new ODataCreateError({ oError })); // {신청}중 오류가 발생하였습니다.
            },
          });
        });
      },
    });
  }
);
