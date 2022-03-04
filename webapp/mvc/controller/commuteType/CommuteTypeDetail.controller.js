/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date',
  ],
  (
    // prettier 방지용 주석
    MessageBox,
    Appno,
    AppUtils,
    AttachFileAction,
    FragmentEvent,
    TextUtils,
    TableUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.commuteType.CommuteTypeDetail', {
      LIST_PAGE_ID: 'container-ehr---commuteType',

      AttachFileAction: AttachFileAction,
      TextUtils: TextUtils,
      TableUtils: TableUtils,
      FragmentEvent: FragmentEvent,

      initializeModel() {
        return {
          FormData: {},
          Settings: {},
          WorkType: [],
          busy: false,
        };
      },

      // setData
      async onObjectMatched(oParameter) {
        const oDetailModel = this.getViewModel();

        oDetailModel.setData(this.initializeModel());

        try {
          // Input Field Imited
          oDetailModel.setProperty('/FieldLimit', _.assignIn(this.getEntityLimit(ServiceNames.WORKTIME, 'WorkScheduleApply')));
          oDetailModel.setProperty('/busy', true);

          const sPernr = this.getAppointeeProperty('Pernr');
          const oModel = this.getModel(ServiceNames.WORKTIME);
          // 대상자리스트
          const aOtpList = await Client.getEntitySet(oModel, 'SchkzList', {
            Pernr: sPernr,
          });

          oDetailModel.setProperty('/WorkType', aOtpList);

          const sDataKey = oParameter.oDataKey;

          if (sDataKey === 'N' || !sDataKey) {
            const sZyymm = oParameter.zyymm;
            const sSchkz = oParameter.schkz;
            const mSessionData = this.getSessionData();

            oDetailModel.setProperty('/FormData', {
              Zyymm: sZyymm,
              Schkz: sSchkz,
            });

            oDetailModel.setProperty('/ApplyInfo', {
              Apename: mSessionData.Ename,
              Aporgtx: `${mSessionData.Btrtx} / ${mSessionData.Orgtx}`,
              Apjikgbtl: `${mSessionData.Zzjikgbt} / ${mSessionData.Zzjikcht}`,
            });
          } else {
            const oView = this.getView();
            const oListView = oView.getParent().getPage(this.LIST_PAGE_ID);
            const mListData = oListView.getModel().getProperty('/parameters');

            oDetailModel.setProperty('/FormData', mListData);
            oDetailModel.setProperty('/ApplyInfo', mListData);
            oDetailModel.setProperty('/ApprovalDetails', mListData);
          }

          this.settingsAttachTable();
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          oDetailModel.setProperty('/busy', false);
        }
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR19';
      },

      getCurrentLocationText(oArguments) {
        const sAction = oArguments.oDataKey === 'N' ? this.getBundleText('LABEL_04002') : this.getBundleText('LABEL_00165');

        return sAction;
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
        const sAppno = oDetailModel.getProperty('/FormData/Appno') || '';

        AttachFileAction.setAttachFile(this, {
          Editable: !sStatus,
          Type: this.getApprovalType(),
          Appno: sAppno,
          Max: 10,
        });
      },
    });
  }
);
