sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/controller/BaseController',
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
        this.AttachFileAction = AttachFileAction;
      }

      onBeforeShow() {
        const oViewModel = new JSONModel({
          busy: false,
          type: 'n',
          appno: null,
          navigation: {
            current: '신규신청',
            links: [
              { name: '근태' }, //
              { name: '근태신청' },
            ],
          },
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

        // 대상자 정보
        EmpInfo.get.call(this);
      }

      onObjectMatched(oEvent) {
        const oParameter = oEvent.getParameter('arguments');
        const oViewModel = this.getView().getModel();
        const sAction = oParameter.appno ? this.getBundleText('LABEL_00100') : ''; // 조회
        const oNavigationMap = {
          n: this.getBundleText('LABEL_04002'), // 신규신청
          m: this.getBundleText('LABEL_04003'), // 변경신청
          c: this.getBundleText('LABEL_04004'), // 취소신청
        };

        if (!oNavigationMap[oParameter.type]) {
          this.getRouter().navTo('attendance');
        }

        if (oParameter.type === 'm') {
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
        oViewModel.setProperty('/appno', oParameter.appno);
        oViewModel.setProperty('/navigation/current', `${oNavigationMap[oParameter.type]} ${sAction}`);
      }

      async openFormDialog() {
        const oView = this.getView();
        const oViewModel = this.getViewModel();

        // 근태유형
        try {
          const mAwartCode = await this.readAwartCodeList();
          oViewModel.setProperty('/form/dialog/awartCodeList', mAwartCode);
        } catch (oError) {
          this.debug('Controller > Attendance Detail > readAwartCodeList Error', AppUtils.parseError(oError));
        }

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
        oViewModel.setProperty('/form/dialog/data/Abrtg', null);
      }

      async onChangeLeaveDate() {
        const oViewModel = this.getViewModel();
        const oFormData = oViewModel.getProperty('/form/dialog/data');

        try {
          const oResult = await this.readLeaveApplEmpList(oFormData);

          this.debug(oResult);
        } catch (error) {
          this.debug('Controller > Attendance Detail > onChangeLeaveDate Error', AppUtils.parseError(oError));
        }
      }

      onPressFormDialogClose() {
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
          BegdaTxt: moment(oInputData.Begda).hours(9).format('YYYY.MM.DD'),
          EnddaTxt: moment(oInputData.Endda).hours(9).format('YYYY.MM.DD'),
        });
        oViewModel.setProperty('/form/list', mListData);
        oViewModel.setProperty('/form/rowCount', mListData.length);

        this.toggleHasRowProperty();
        this.byId('formDialog').close();
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

      readLeaveApplEmpList({ Awart, Begda, Endda }) {
        return new Promise((resolve, reject) => {
          const oModel = this.getModel(ServiceNames.WORKTIME);
          const sUrl = '/LeaveApplEmpListSet';

          oModel.read(sUrl, {
            filters: [
              new Filter('Prcty', FilterOperator.EQ, 'C'), //
              new Filter('Awart', FilterOperator.EQ, Awart),
              new Filter('Begda', FilterOperator.EQ, moment(Begda).hour(9).toDate()),
              new Filter('Endda', FilterOperator.EQ, moment(Endda).hour(9).toDate()),
            ],
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(oData.results[0]);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(oError);
            },
          });
        });
      }
    }

    return Detail;
  }
);
