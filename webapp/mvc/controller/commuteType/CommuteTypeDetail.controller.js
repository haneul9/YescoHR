/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/exceptions/ODataCreateError',
    'sap/ui/yesco/common/exceptions/ODataDeleteError',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date', // DatePicker 에러 방지 import : Loading of data failed: Error: Date must be a JavaScript date object
  ],
  (
    // prettier 방지용 주석
    AttachFileAction,
    Appno,
    AppUtils,
    ComboEntry,
    FragmentEvent,
    TextUtils,
    ServiceNames,
    MessageBox,
    ODataReadError,
    ODataCreateError,
    ODataDeleteError,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.commuteType.CommuteTypeDetail', {
      LIST_PAGE_ID: 'container-ehr---commuteType',

      AttachFileAction: AttachFileAction,
      TextUtils: TextUtils,
      FragmentEvent: FragmentEvent,

      initializeModel() {
        return {
          FormStatus: '',
          werks: this.getAppointeeProperty('Werks'),
          FormData: {},
          Relations: [],
          Gender: [
            { Zcode: this.GENDER.CODE.A, Ztext: this.GENDER.TEXT.N },
            { Zcode: this.GENDER.CODE.O, Ztext: this.GENDER.TEXT.M },
            { Zcode: this.GENDER.CODE.T, Ztext: this.GENDER.TEXT.W },
          ],
          Disability: [
            { Zcode: this.DISABIL.CODE.A, Ztext: this.DISABIL.TEXT.A },
            { Zcode: this.DISABIL.CODE.O, Ztext: this.DISABIL.TEXT.O },
            { Zcode: this.DISABIL.CODE.TW, Ztext: this.DISABIL.TEXT.TW },
            { Zcode: this.DISABIL.CODE.TH, Ztext: this.DISABIL.TEXT.TH },
          ],
          Fixed: false,
          Support: [],
          Settings: {},
          busy: false,
          DisabCheck: 'None', // 장애여부 CheckState
          SupCheck: 'None', // 부양가족유형 CheckState
          SupEditable: false, // 부양가족유형 Combo
          DisabEditable: false, // 장애여부 Combo
        };
      },

      // setData
      async onObjectMatched(oParameter) {
        const oViewModel = this.getViewModel();
        const sDataKey = oParameter.oDataKey;

        oViewModel.setData(this.initializeModel());
        oViewModel.setProperty('/busy', true);
        // Input Field Imited
        oViewModel.setProperty('/FieldLimit', _.assignIn(this.getEntityLimit(ServiceNames.PA, 'FamilyInfoAppl')));
        oViewModel.setProperty('/FormStatus', sDataKey);
        await this.getCodeList();
        await this.setFormData();

        this.getViewModel().setProperty('/busy', false);
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR03';
      },

      getCurrentLocationText(oArguments) {
        const sAction = oArguments.oDataKey === 'N' ? this.getBundleText('LABEL_04002') : this.getBundleText('LABEL_00165');

        return sAction;
      },

      setResident(s = '') {
        const iLength = s.length;
        let sValue = '';

        if (iLength > 6) {
          sValue = `${s.slice(0, 6)}-${s.slice(6)}`;
        } else {
          sValue = s;
        }

        return sValue;
      },

      setFormData() {
        const oDetailModel = this.getViewModel();
        const sKey = oDetailModel.getProperty('/FormStatus');
        const oView = this.getView();
        const oListView = oView.getParent().getPage(this.LIST_PAGE_ID);

        if (!sKey || sKey === 'N') {
          if (!!oListView && !!oListView.getModel().getProperty('/parameter')) {
            oDetailModel.setProperty('/Fixed', true);
            oDetailModel.setProperty('/FormData', oListView.getModel().getProperty('/parameter'));
          } else {
            const oAppointeeData = this.getAppointeeData();

            oDetailModel.setProperty('/FormData', {
              Apename: oAppointeeData.Ename,
              Appernr: oAppointeeData.Pernr,
              Kdsvh: 'ALL',
              Fasex: 'ALL',
              Hndcd: 'ALL',
              Dptyp: 'ALL',
              Endda: moment('9999-12-31').hours(9).toDate(),
            });
          }
          this.settingsAttachTable();
        } else {
          const oModel = this.getModel(ServiceNames.PA);

          if (!!oListView && !!oListView.getModel().getProperty('/parameter')) {
            oDetailModel.setProperty('/FormData', oListView.getModel().getProperty('/parameter'));
            this.settingsAttachTable();
          } else {
            oModel.read('/FamilyInfoApplSet', {
              filters: [new sap.ui.model.Filter('Prcty', sap.ui.model.FilterOperator.EQ, 'D'), new sap.ui.model.Filter('Menid', sap.ui.model.FilterOperator.EQ, this.getCurrentMenuId()), new sap.ui.model.Filter('Appno', sap.ui.model.FilterOperator.EQ, sKey)],
              success: (oData) => {
                if (oData) {
                  oDetailModel.setProperty('/FormData', oData.results[0]);
                  this.settingsAttachTable();
                }
              },
              error: (oError) => {
                AppUtils.handleError(new ODataReadError(oError));
              },
            });
          }
        }
      },

      // 화면관련 List호출
      getCodeList() {
        const oModel = this.getModel(ServiceNames.PA);
        const oDetailModel = this.getViewModel();
        const sKdsvhtUrl = '/KdsvhCodeListSet';
        const sDptypUrl = '/DptypCodeListSet';

        return Promise.all([
          new Promise((resolve) => {
            // 가족관계
            oModel.read(sKdsvhtUrl, {
              filters: [],
              success: (oData) => {
                if (oData) {
                  this.debug(`${sKdsvhtUrl} success.`, oData);

                  const aList = oData.results;

                  oDetailModel.setProperty('/Relations', new ComboEntry({ codeKey: 'Auspr', valueKey: 'Atext', aEntries: aList }));

                  resolve();
                }
              },
              error: (oError) => {
                AppUtils.handleError(new ODataReadError(oError));
              },
            });
          }),
          new Promise((resolve) => {
            // 부양가족유형
            oModel.read(sDptypUrl, {
              filters: [new sap.ui.model.Filter('Begda', sap.ui.model.FilterOperator.EQ, new Date())],
              success: (oData) => {
                if (oData) {
                  this.debug(`${sDptypUrl} success.`, oData);

                  const aList = oData.results;

                  oDetailModel.setProperty('/Support', new ComboEntry({ codeKey: 'Dptyp', valueKey: 'Dptyx', aEntries: aList }));
                  resolve();
                }
              },
              error: (oError) => {
                AppUtils.handleError(new ODataReadError(oError));
              },
            });
          }),
        ]);
      },

      // 주민번호입력시
      ResidentNumber(oEvent) {
        const oEventSource = oEvent.getSource();
        const sPath = oEventSource.getBinding('value').getPath();
        const sValue = oEvent.getParameter('value').trim().replace(/[^\d]/g, '');
        const iLength = sValue.length;
        let sPropValue = '';

        if (iLength > 6) {
          sPropValue = `${sValue.slice(0, 6)}-${sValue.slice(6)}`;
        } else {
          sPropValue = sValue;
        }

        oEventSource.setValue(sPropValue);
        oEventSource.getModel().setProperty(sPath, sValue);
      },

      // 부양가족여부, 장애여부, 동거, 건강보험피부양자, 가족수당 체크
      onCheckBox(oEvent) {
        const oEventSource = oEvent.getSource();
        const sPath = oEventSource.getBinding('selected').aBindings[0].getPath();
        const iValueIndex = sPath.lastIndexOf('/') + 1;
        const oDetailModel = this.getViewModel();
        const bSelected = oEventSource.getSelected();

        switch (sPath.slice(iValueIndex)) {
          // 부양가족
          case 'Dptid':
            if (bSelected) {
              oDetailModel.setProperty('/SupEditable', true);
            } else {
              oDetailModel.setProperty('/SupEditable', false);
            }
            oDetailModel.setProperty('/FormData/Dptyp', 'ALL');
            break;
          // 장애여부
          case 'Hndid':
            if (bSelected) {
              oDetailModel.setProperty('/DisabEditable', true);
            } else {
              oDetailModel.setProperty('/DisabEditable', false);
            }
            oDetailModel.setProperty('/FormData/Hndcd', 'ALL');
            break;
          // 동거
          case 'Livid':
            break;
          // 건강보험피부양자
          case 'Helid':
            break;
          // 가족수당
          case 'Famid':
            break;
          default:
            return;
        }

        if (bSelected) {
          oDetailModel.setProperty(sPath, 'X');
        } else {
          oDetailModel.setProperty(sPath, '');
        }
      },

      checkError() {
        const oDetailModel = this.getViewModel();
        const oFormData = oDetailModel.getProperty('/FormData');

        // 성명
        if (!oFormData.Lnmhg || !oFormData.Fnmhg) {
          MessageBox.alert(this.getBundleText('MSG_05009'));
          return true;
        }

        // 주민등록번호
        if (!oFormData.Regno) {
          MessageBox.alert(this.getBundleText('MSG_05010'));
          return true;
        }

        // 가족관계
        if (oFormData.Kdsvh === 'ALL' || !oFormData.Kdsvh) {
          MessageBox.alert(this.getBundleText('MSG_05011'));
          return true;
        }

        // 성별
        if (oFormData.Fasex === 'ALL' || !oFormData.Fasex) {
          MessageBox.alert(this.getBundleText('MSG_05012'));
          return true;
        }

        // 장애여부
        if (!!oFormData.Hndid && (oFormData.Hndcd === 'ALL' || !oFormData.Hndcd)) {
          MessageBox.alert(this.getBundleText('MSG_05013'));
          return true;
        }

        // 부양가족유형
        if (!!oFormData.Dptid && (oFormData.Dptyp === 'ALL' || !oFormData.Dptyp)) {
          MessageBox.alert(this.getBundleText('MSG_05014'));
          return true;
        }

        // 적용시작일
        if (!oFormData.Begda) {
          MessageBox.alert(this.getBundleText('MSG_05015'));
          return true;
        }

        // 적용종료일
        if (!oFormData.Endda) {
          MessageBox.alert(this.getBundleText('MSG_05016'));
          return true;
        }

        // 첨부파일
        if (!AttachFileAction.getFileCount.call(this)) {
          MessageBox.alert(this.getBundleText('MSG_03005'));
          return true;
        }

        return false;
      },

      // 신청
      async onApplyBtn() {
        if (this.checkError()) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00121'), {
          actions: [this.getBundleText('LABEL_00121'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00121')) {
              try {
                AppUtils.setAppBusy(true, this);

                const oDetailModel = this.getViewModel();
                const sStatus = oDetailModel.getProperty('/FormData/ZappStatAl');

                if (!sStatus || sStatus === '60') {
                  const vAppno = await Appno.get.call(this);

                  oDetailModel.setProperty('/FormData/Appno', vAppno);
                  oDetailModel.setProperty('/FormData/Appdt', new Date());
                }

                const oModel = this.getModel(ServiceNames.PA);
                const oFormData = oDetailModel.getProperty('/FormData');
                const sMenid = this.getCurrentMenuId();
                let oSendObject = {};

                oSendObject = oFormData;
                oSendObject.Prcty = 'C';
                oSendObject.Menid = sMenid;

                // FileUpload
                await AttachFileAction.uploadFile.call(this, oFormData.Appno, this.getApprovalType());

                await new Promise((resolve, reject) => {
                  oModel.create('/FamilyInfoApplSet', oSendObject, {
                    success: () => {
                      resolve();
                    },
                    error: (oError) => {
                      reject(new ODataCreateError({ oError }));
                    },
                  });
                });

                MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00121'), {
                  onClose: () => {
                    this.onNavBack();
                  },
                });
              } catch (oError) {
                AppUtils.handleError(oError);
              } finally {
                AppUtils.setAppBusy(false, this);
              }
            }
          },
        });
      },

      // 삭제
      onDeleteBtn() {
        const oModel = this.getModel(ServiceNames.PA);
        const oDetailModel = this.getViewModel();

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00110'), {
          actions: [this.getBundleText('LABEL_00110'), this.getBundleText('LABEL_00118')],
          onClose: (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00110')) {
              AppUtils.setAppBusy(true, this);

              const sPath = oModel.createKey('/FamilyInfoApplSet', {
                Appno: oDetailModel.getProperty('/FormData/Appno'),
              });

              oModel.remove(sPath, {
                success: () => {
                  MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00110'), {
                    onClose: () => {
                      AppUtils.setAppBusy(false, this);
                      this.onNavBack();
                    },
                  });
                },
                error: (oError) => {
                  AppUtils.handleError(new ODataDeleteError(oError));
                  AppUtils.setAppBusy(false, this);
                },
              });
            }
          },
        });
      },

      // AttachFileTable Settings
      settingsAttachTable() {
        const oDetailModel = this.getViewModel();
        const sStatus = oDetailModel.getProperty('/FormData/ZappStatAl');
        const bFixed = oDetailModel.getProperty('/Fixed');
        const sAppno = oDetailModel.getProperty('/FormData/Appno') || '';

        AttachFileAction.setAttachFile(this, {
          Editable: !sStatus || sStatus === '10' || bFixed,
          Type: this.getApprovalType(),
          Appno: sAppno,
          Max: 10,
        });
      },
    });
  }
);
