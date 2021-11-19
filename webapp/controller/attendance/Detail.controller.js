/* eslint-disable no-else-return */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/controller/BaseController',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/EmpInfo',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/Validator',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    Filter,
    FilterOperator,
    JSONModel,
    MessageBox,
    BaseController,
    Appno,
    AppUtils,
    AttachFileAction,
    EmpInfo,
    ServiceNames,
    TableUtils,
    Validator
  ) => {
    'use strict';

    class Detail extends BaseController {
      constructor() {
        super();

        this.LIST_PAGE_ID = 'container-ehr---attendanceList';
        this.TYPE_CODE = 'HR04';
        this.PAGE_TYPE = { NEW: 'A', CHANGE: 'B', CANCEL: 'C' };
        this.ACTION = {
          T: 'LABEL_00104', // 임시저장
          C: 'LABEL_00121', // 신청
        };

        this.AttachFileAction = AttachFileAction;
      }

      onBeforeShow() {
        const oViewModel = new JSONModel({
          busy: false,
          type: this.PAGE_TYPE.NEW,
          Appno: null,
          ZappStatAl: null,
          navigation: {
            current: '신규신청',
            links: [
              { name: '근태' }, //
              { name: '근태신청' },
            ],
          },
          ApplyInfo: {},
          form: {
            hasRow: false,
            rowCount: 1,
            list: [],
            dialog: {
              calcCompleted: false,
              awartCodeList: [{ Awart: 'ALL', Atext: this.getBundleText('LABEL_00268'), Alldf: true }],
              data: {
                Awart: 'ALL',
              },
            },
          },
        });
        this.setViewModel(oViewModel);

        const oRouter = this.getRouter();
        oRouter.getRoute('attendance-detail').attachPatternMatched(this.onObjectMatched, this);
      }

      async onAfterShow() {
        const oView = this.getView();
        const oViewModel = oView.getModel();
        const sAppno = oViewModel.getProperty('/Appno');
        const sType = oViewModel.getProperty('/type');

        // 대상자 정보
        EmpInfo.get.call(this);

        this.initializeApplyInfoBox();
        this.initializeAttachBox();

        try {
          const oListView = oView.getParent().getPage(this.LIST_PAGE_ID);
          const mListSelectedData = oListView.getModel().getProperty('/parameter/rowData');

          if (sAppno) {
            const mRowData = await this.readLeaveApplEmpList({ Prcty: 'R', Appno: sAppno });

            this.setTableData({ oViewModel, mRowData });
            oViewModel.setProperty('/ZappStatAl', mListSelectedData[0].ZappStatAl);
          } else if (sType === this.PAGE_TYPE.CHANGE || sType === this.PAGE_TYPE.CANCEL) {
            // 변경|취소 신청의 경우 List페이지에서 선택된 데이터를 가져온다.
            this.setTableData({ sType, oViewModel, mRowData: mListSelectedData });
          }
        } catch (error) {
          // {조회}중 오류가 발생하였습니다.
          MessageBox.error(this.getBundleText('MSG_00008', 'LABEL_00100'), {
            onClose: () => this.getRouter().navTo('attendance'),
          });
        }

        super.onAfterShow();
      }

      setTableData({ sType, oViewModel, mRowData }) {
        oViewModel.setProperty('/form/rowCount', mRowData.length);
        oViewModel.setProperty(
          '/form/list',
          mRowData.map((o) => {
            if (sType === this.PAGE_TYPE.CHANGE) {
              return {
                ...o,
                Abrtg2: o.Abrtg,
                AbrtgTxt2: Number(o.Abrtg),
                Abrtg: null,
                Abrst2: o.Abrst,
                Abrst: null,
                Begda2: moment(o.Begda).hours(9).toDate(),
                Endda2: moment(o.Endda).hours(9).toDate(),
                BegdaTxt2: moment(o.Begda).hours(9).format('YYYY.MM.DD'),
                EnddaTxt2: moment(o.Endda).hours(9).format('YYYY.MM.DD'),
                Begda: null,
                Endda: null,
                BegdaTxt: null,
                EnddaTxt: null,
              };
            } else {
              return {
                ...o,
                AbrtgTxt: `${parseInt(o.Abrtg, 10)}일`,
                Begda: moment(o.Begda).hours(9).toDate(),
                Endda: moment(o.Endda).hours(9).toDate(),
                BegdaTxt: moment(o.Begda).hours(9).format('YYYY.MM.DD'),
                EnddaTxt: moment(o.Endda).hours(9).format('YYYY.MM.DD'),
              };
            }
          })
        );

        this.toggleHasRowProperty();
      }

      onObjectMatched(oEvent) {
        const oParameter = oEvent.getParameter('arguments');
        const oViewModel = this.getView().getModel();
        const sAction = oParameter.appno ? this.getBundleText('LABEL_00100') : ''; // 조회
        const oNavigationMap = {
          A: this.getBundleText('LABEL_04002'), // 신규신청
          B: this.getBundleText('LABEL_04003'), // 변경신청
          C: this.getBundleText('LABEL_04004'), // 취소신청
        };

        if (!oNavigationMap[oParameter.type]) {
          this.getRouter().navTo('attendance');
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
                  theadOrTbody: 'header',
                });
              },
            },
            oTable
          );
        }

        oViewModel.setProperty('/type', oParameter.type);
        oViewModel.setProperty('/Appno', oParameter.appno);
        oViewModel.setProperty('/navigation/current', `${oNavigationMap[oParameter.type]} ${sAction}`);
      }

      initializeApplyInfoBox() {
        const oViewModel = this.getViewModel();
        const oSessionData = this.getOwnerComponent().getSessionModel().getData();

        oViewModel.setProperty('/ApplyInfo', {
          Apename: oSessionData.Ename,
          Orgtx: `${oSessionData.Btrtx}/${oSessionData.Orgtx}`,
          Apjikgbtl: `${oSessionData.Zzjikgbt}/${oSessionData.Zzjiktlt}`,
        });
      }

      initializeAttachBox() {
        const oViewModel = this.getViewModel();
        const sStatus = oViewModel.getProperty('/ZappStatAl');
        const sAppno = oViewModel.getProperty('/Appno') || '';

        AttachFileAction.setAttachFile(this, {
          Editable: !sStatus || sStatus === '10',
          Type: this.TYPE_CODE,
          Appno: sAppno,
          Message: this.getBundleText('MSG_00037'), // 증빙자료를 꼭 등록 해주세요.
          Max: 10,
          FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'png'],
        });
      }

      async openFormDialog() {
        const oView = this.getView();
        const oViewModel = this.getViewModel();

        AppUtils.setAppBusy(true, this);

        // 근태유형
        try {
          const mAwartCode = await this.readAwartCodeList();
          oViewModel.setProperty('/form/dialog/awartCodeList', mAwartCode);
        } catch (oError) {
          this.debug('Controller > Attendance Detail > readAwartCodeList Error', AppUtils.parseError(oError));
        }

        setTimeout(() => {
          if (!this.pFormDialog) {
            this.pFormDialog = Fragment.load({
              id: oView.getId(),
              name: 'sap.ui.yesco.view.attendance.fragment.FormDialog',
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
      }

      toggleHasRowProperty() {
        const oViewModel = this.getViewModel();
        const mTableData = oViewModel.getProperty('/form/list');

        oViewModel.setProperty('/form/hasRow', !!mTableData.length);
      }

      /*****************************************************************
       * Event handler
       *****************************************************************/
      onPressAddBtn() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/form/dialog/calcCompleted', false);
        oViewModel.setProperty('/form/dialog/data', { Awart: 'ALL' });

        this.openFormDialog();
      }

      onPressChangeBtn() {}

      onPressDelBtn() {
        const oViewModel = this.getViewModel();
        const oTable = this.byId('approveSingleTable');
        const aSelectedIndices = oTable.getSelectedIndices();
        const mTableData = oViewModel.getProperty('/form/list');

        if (aSelectedIndices.length < 1) {
          MessageBox.alert(this.getBundleText('MSG_00020')); // 삭제할 행을 선택하세요.
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
      }

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
      }

      async onChangeLeaveDate() {
        const oViewModel = this.getViewModel();
        const oFormData = oViewModel.getProperty('/form/dialog/data');

        try {
          const mResult = await this.readLeaveApplEmpList({ Prcty: 'C', ...oFormData });
          const oResultData = mResult[0];

          if (!_.isEmpty(oResultData)) {
            oViewModel.setProperty('/form/dialog/data/Abrst', oResultData.Abrst);
            oViewModel.setProperty('/form/dialog/data/Abrtg', oResultData.Abrtg);
            oViewModel.setProperty('/form/dialog/data/AbrtgTxt', `${parseInt(oResultData.Abrtg, 10)}일`);
            oViewModel.setProperty('/form/dialog/calcCompleted', true);
          }
        } catch (oError) {
          this.debug('Controller > Attendance Detail > onChangeLeaveDate Error', AppUtils.parseError(oError));
        }
      }

      onPressFormDialogClose() {
        AppUtils.setAppBusy(false, this);
        this.byId('formDialog').close();
      }

      onPressFormDialogSave() {
        const oViewModel = this.getViewModel();
        const bCalcCompleted = oViewModel.getProperty('/form/dialog/calcCompleted');
        const oInputData = oViewModel.getProperty('/form/dialog/data');
        const mListData = oViewModel.getProperty('/form/list');
        const mCheckFields = [
          { field: 'Tmrsn', label: this.getBundleText('LABEL_04009'), type: Validator.SELECT2 }, // 근태사유
        ];

        if (!bCalcCompleted) {
          MessageBox.error(this.getBundleText('MSG_04001')); // 계산이 수행되지 않아 저장이 불가합니다.
          return;
        }

        if (!Validator.check.call(this, { oInputData, mCheckFields })) return;

        mListData.push({
          ...oInputData,
          Begda: moment(oInputData.Begda).hours(9).toDate(),
          Endda: moment(oInputData.Endda).hours(9).toDate(),
          BegdaTxt: moment(oInputData.Begda).hours(9).format('YYYY.MM.DD'),
          EnddaTxt: moment(oInputData.Endda).hours(9).format('YYYY.MM.DD'),
        });
        oViewModel.setProperty('/form/list', mListData);
        oViewModel.setProperty('/form/rowCount', mListData.length);

        this.toggleHasRowProperty();

        AppUtils.setAppBusy(false, this);
        this.byId('formDialog').close();
      }

      onPressSave() {
        AppUtils.setAppBusy(true, this);

        const sPrcty = 'T';

        this.createProcess({ sPrcty });
      }

      onPressApproval() {
        AppUtils.setAppBusy(true, this);

        const sPrcty = 'C';

        // {신청}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00121'), {
          actions: [this.getBundleText('LABEL_00121'), MessageBox.Action.CANCEL],
          onClose: (sAction) => {
            if (sAction === MessageBox.Action.CANCEL) {
              AppUtils.setAppBusy(false, this);
              return;
            }

            this.createProcess({ sPrcty });
          },
        });
      }

      /*****************************************************************
       * Call oData
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

              resolve([...mAwartCodeList, ...oData.results]);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(oError);
            },
          });
        });
      }

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

              if (Prcty === 'R') {
                // {조회}중 오류가 발생하였습니다.
                reject({ code: 'E', message: this.getBundleText('MSG_00008', 'LABEL_00100') });
              } else {
                reject(oError);
              }
            },
          });
        });
      }

      /**
       *
       * @param {String} sPrcty -  T:임시저장, C:신청
       * @returns
       */
      createLeaveApplContent(sPrcty) {
        return new Promise((resolve, reject) => {
          const oModel = this.getModel(ServiceNames.WORKTIME);
          const oViewModel = this.getViewModel();
          const oTargetInfo = oViewModel.getProperty('/TargetInfo');
          const mTableData = oViewModel.getProperty('/form/list');
          const sAppty = oViewModel.getProperty('/type');
          const sAppno = oViewModel.getProperty('/Appno');
          const sUrl = '/LeaveApplContentSet';

          const oPayload = {
            Pernr: oTargetInfo.Pernr,
            Orgeh: oTargetInfo.Orgeh,
            Appno: sAppno,
            Prcty: sPrcty,
            Appty: sAppty, // A:신규, B:변경, C:취소
            LeaveApplNav1: mTableData.map((o) => ({ ...o, Pernr: oTargetInfo.Pernr })),
          };

          oModel.create(sUrl, oPayload, {
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(oData.results);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, AppUtils.parseError(oError));

              // {임시저장|신청}중 오류가 발생하였습니다.
              reject({ code: 'E', message: this.getBundleText('MSG_00008', this.ACTION[sPrcty]) });
            },
          });
        });
      }

      async createProcess({ sPrcty = 'T' }) {
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
          MessageBox.success(this.getBundleText('MSG_00007', this.ACTION[sPrcty]));

          if (sPrcty !== 'T') {
            this.getRouter().navTo('attendance');
          } else {
            oViewModel.setProperty('ZappStatAl', 10);
          }
        } catch (error) {
          if (_.has(error, 'code') && error.code === 'E') {
            MessageBox.error(error.message);
          }
        } finally {
          AppUtils.setAppBusy(false, this);
        }
      }
    }

    return Detail;
  }
);
