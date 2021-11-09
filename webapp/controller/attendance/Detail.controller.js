sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/core/Fragment',
    'sap/ui/yesco/controller/BaseController',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/EmpInfo',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/TableUtils3',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/extension/moment',
    'sap/ui/yesco/extension/lodash',
  ],
  (
    // prettier 방지용 주석
    Filter,
    FilterOperator,
    JSONModel,
    Fragment,
    BaseController,
    ServiceNames,
    EmpInfo,
    AttachFileAction,
    TableUtils3,
    MessageBox
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
            hasrow: false,
            rowcount: 1,
            list: [],
            dialog: {
              calcCompleted: false,
              awartCodeList: [{ Awart: 'ALL', Atext: this.getText('LABEL_00268'), Alldf: true }],
              data: {
                Awart: 'ALL',
              },
            },
          },
        });
        this.setViewModel(oViewModel);

        const oRouter = this.getRouter();
        oRouter.getRoute('attendanceDetail').attachPatternMatched(this.onObjectMatched, this);

        // 대상자 정보
        EmpInfo.get.call(this);

        // Multiple table generate
        const oTable = this.byId('approveMultipleTable');
        oTable.addEventDelegate(
          {
            onAfterRendering: () => {
              TableUtils3.adjustRowSpan({
                table: oTable,
                colIndices: [0, 7],
                theadOrTbody: 'header',
              });
            },
          },
          oTable
        );
      }

      onObjectMatched(oEvent) {
        const oParameter = oEvent.getParameter('arguments');
        const oViewModel = this.getView().getModel();
        const sAction = oParameter.appno ? '조회' : '';
        const oNavimap = {
          n: '신규신청',
          m: '변경신청',
          c: '취소신청',
        };

        if (!oNavimap[oParameter.type]) {
          this.getRouter().navTo('attendance');
        }

        oViewModel.setProperty('/type', oParameter.type);
        oViewModel.setProperty('/appno', oParameter.appno);
        oViewModel.setProperty('/navigation/current', `${oNavimap[oParameter.type]} ${sAction}`);
      }

      openFormDialog() {
        var oView = this.getView();

        // 근태유형
        this.readAwartCodeList();

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

      toggleHasrowProperty() {
        const oViewModel = this.getViewModel();
        const mTableData = oViewModel.getProperty('/form/list');

        oViewModel.setProperty('/form/hasrow', !!mTableData.length);
      }

      /*****************************************************************
       * Event handler
       *****************************************************************/
      onPressBackBtn() {
        this.getRouter().navTo('attendance');
      }

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
          // 삭제할 행을 선택하세요.
          MessageBox.alert(this.getText('MSG_00020'));
          return;
        }

        // 선택된 행을 삭제하시겠습니까?
        MessageBox.confirm(this.getText('MSG_00021'), {
          onClose: function (oAction) {
            if (MessageBox.Action.OK === oAction) {
              const mUnSeletedData = mTableData.filter((elem, idx) => {
                return !aSelectedIndices.some(function (iIndex) {
                  return iIndex === idx;
                });
              });

              oViewModel.setProperty('/form/list', mUnSeletedData);
              oViewModel.setProperty('/form/rowcount', mUnSeletedData.length);

              this.toggleHasrowProperty();
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

      onChangeLeaveDate() {
        const oViewModel = this.getViewModel();
        const oFormData = oViewModel.getProperty('/form/dialog/data');

        this.readLeaveApplEmpList(oFormData);
      }

      onPressFormDialogClose() {
        this.byId('formDialog').close();
      }

      onPressFormDialogSave() {
        const oViewModel = this.getViewModel();
        const bCalcCompleted = oViewModel.getProperty('/form/dialog/calcCompleted');
        const oInputData = oViewModel.getProperty('/form/dialog/data');
        const mListData = oViewModel.getProperty('/form/list');

        if (!bCalcCompleted) {
          MessageBox.error('계산이 수행되지 않아 저장이 불가합니다.');
          return;
        }

        if (!oInputData.Tmrsn) {
          // {근태사유}를 입력하세요.
          MessageBox.error(this.getText('MSG_00003', '근태사유'));
          return;
        }

        mListData.push({
          ...oInputData,
          BegdaTxt: moment(oInputData.Begda).hours(9).format('YYYY.MM.DD'),
          EnddaTxt: moment(oInputData.Endda).hours(9).format('YYYY.MM.DD'),
        });
        oViewModel.setProperty('/form/list', mListData);
        oViewModel.setProperty('/form/rowcount', mListData.length);

        this.toggleHasrowProperty();
        this.byId('formDialog').close();
      }

      /*****************************************************************
       * Call oData
       *****************************************************************/
      readAwartCodeList() {
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const oViewModel = this.getViewModel();
        const sUrl = '/AwartCodeListSet';
        const mAwartCodeList = oViewModel.getProperty('/form/dialog/awartCodeList');

        if (mAwartCodeList.length > 1) return;

        oModel.read(sUrl, {
          success: (oData) => {
            oViewModel.setProperty('/form/dialog/awartCodeList', [...mAwartCodeList, ...oData.results]);
          },
          error: (oError) => {
            this.debug(`${sUrl} error.`, oError);
          },
        });
      }

      readLeaveApplEmpList({ Awart, Begda, Endda }) {
        const oModel = this.getModel(ServiceNames.WORKTIME);
        // const oViewModel = this.getViewModel();
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
          },
          error: (oError) => {
            this.debug(`${sUrl} error.`, oError);
          },
        });
      }
    }

    return Detail;
  }
);
