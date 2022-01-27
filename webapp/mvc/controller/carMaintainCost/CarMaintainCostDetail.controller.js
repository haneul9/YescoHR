/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/exceptions/ODataCreateError',
    'sap/ui/yesco/common/exceptions/ODataDeleteError',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date',
    'sap/ui/yesco/mvc/model/type/Currency',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    JSONModel,
    MessageBox,
    Appno,
    AppUtils,
    AttachFileAction,
    ComboEntry,
    FragmentEvent,
    TextUtils,
    TableUtils,
    Client,
    ServiceNames,
    ODataReadError,
    ODataCreateError,
    ODataDeleteError,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.carMaintainCost.CarMaintainCostDetail', {
      LIST_PAGE_ID: 'container-ehr---carMaintainCost',

      AttachFileAction: AttachFileAction,
      TextUtils: TextUtils,
      TableUtils: TableUtils,
      FragmentEvent: FragmentEvent,

      onBeforeShow() {
        const oViewModel = new JSONModel({
          menid: this.getCurrentMenuId(),
          Hass: this.isHass(),
          ViewKey: '',
          sYear: '',
          FormData: {
            Fixed: true,
          },
          DialogData: {},
          TargetDetails: {},
          RemoveFiles: [],
          HisList: [],
          TargetList: [],
          ReceiptType: [],
          HisDeleteDatas: [],
          Settings: {},
          listInfo: {
            rowCount: 1,
            totalCount: 0,
            progressCount: 0,
            applyCount: 0,
            approveCount: 0,
            rejectCount: 0,
            completeCount: 0,
          },
          busy: false,
        });
        this.setViewModel(oViewModel);

        this.getViewModel().setProperty('/busy', true);
      },

      async onObjectMatched(oParameter) {
        const sDataKey = oParameter.oDataKey;
        const sAppty = oParameter.appty || '';
        const oDetailModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.BENEFIT);

        oDetailModel.setProperty('/ViewKey', sDataKey);

        try {
          const mBankList = await Client.getEntitySet(oModel, 'BenefitCodeList', { Cdnum: 'BE0019' });

          // 지정은행
          oDetailModel.setProperty('/BankList', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: mBankList }));

          // 신청구분
          const mMaintainType = await Client.getEntitySet(oModel, 'BenefitCodeList', { Cdnum: 'BE0020' });

          oDetailModel.setProperty('/MaintainType', mMaintainType);

          // 운전면허종별
          const sWerks = this.getAppointeeProperty('Werks');
          const dDatum = new Date();
          const mLicenseType = await Client.getEntitySet(oModel, 'BenefitCodeList', {
            Werks: sWerks,
            Datum: dDatum,
            Cdnum: 'BE0021',
            Grcod: 'BE000050',
            Sbcod: 'IDTYP',
          });

          oDetailModel.setProperty('/LicenseType', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: mLicenseType }));

          // 신청부서/업무
          const mAppDept = await Client.getEntitySet(oModel, 'BenefitCodeList', {
            Werks: sWerks,
            Datum: dDatum,
            Cdnum: 'BE0022',
            Grcod: 'BE000051',
          });

          oDetailModel.setProperty('/AppDept', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: mAppDept }));

          // 지급방식
          const mPayType = await Client.getEntitySet(oModel, 'BenefitCodeList', {
            Werks: sWerks,
            Datum: dDatum,
            Cdnum: 'BE0021',
            Grcod: 'BE000050',
            Sbcod: 'PAYTO',
          });

          oDetailModel.setProperty('/PayType', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: mPayType }));

          // 지급신청 및 해지, 변경사항 발생시 7일 이내에 인재개발팀에 제반 서류를 제출, 등록하시기 바랍니다.
          let sMsg = this.getBundleText('MSG_25004');

          oDetailModel.setProperty('/InfoMessage', sMsg);

          if (sDataKey === 'N' || !sDataKey) {
            const mSessionData = this.getSessionData();

            oDetailModel.setProperty('/FormData', {
              Ename: this.getAppointeeProperty('Ename'),
              Fixed: true,
              Appty: '',
              Payorg: 'ALL',
              Idtype: 'ALL',
              Payty: 'ALL',
              Bankl: 'ALL',
            });

            oDetailModel.setProperty('/ApplyInfo', {
              Apename: mSessionData.Ename,
              Aporgtx: `${mSessionData.Btrtx} / ${mSessionData.Orgtx}`,
              Apjikgbtl: `${mSessionData.Zzjikgbt} / ${mSessionData.Zzjikcht}`,
            });
          } else {
            let oSendObject = {};

            oSendObject.Prcty = 'D';
            oSendObject.Appno = sViewKey;
            oSendObject.MedExpenseItemSet = [];

            oDetailModel.setProperty('/busy', true);

            oDetailModel.setProperty('/FormData', oTargetData);
            oDetailModel.setProperty('/ApplyInfo', oTargetData);
            oDetailModel.setProperty('/TargetDetails', oTargetData);
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
        return 'HR14';
      },

      getCurrentLocationText(oArguments) {
        const sAction = oArguments.oDataKey === 'N' ? this.getBundleText('LABEL_04002') : this.getBundleText('LABEL_00165');

        return sAction;
      },

      // 신청구분 선택
      onMaintainType(oEvent) {
        const oDetailModel = this.getViewModel();
        const sKey = oEvent.getSource().getSelectedKey();

        switch (sKey) {
          case '':
            oDetailModel.setProperty('/FormData/Fixed', true);
            break;
          case '':
            oDetailModel.setProperty('/FormData/Fixed');
            break;
          case '':
            oDetailModel.setProperty('/FormData/Fixed');
            break;
        }
      },

      checkError() {
        const oDetailModel = this.getViewModel();
        const mFormData = oDetailModel.getProperty('/FormData');

        // 신청대상
        if (mFormData.Kdsvh === 'ALL' || !mFormData.Kdsvh) {
          MessageBox.alert(this.getBundleText('MSG_09025'));
          return true;
        }

        // 비고
        if (!mFormData.Zbigo) {
          MessageBox.alert(this.getBundleText('MSG_09026'));
          return true;
        }

        const aHisList = oDetailModel.getProperty('/HisList');

        // 상세내역
        if (!aHisList.length) {
          MessageBox.alert(this.getBundleText('MSG_09027'));
          return true;
        }

        // 첨부파일
        const bResult = aHisList.every((e) => e.Attyn === 'X');

        if (!bResult && !AttachFileAction.getFileCount.call(this)) {
          MessageBox.alert(this.getBundleText('MSG_09028'));
          return true;
        }

        return false;
      },
      // 재작성
      onRewriteBtn() {
        const oDetailModel = this.getViewModel();

        oDetailModel.setProperty('/FormData/Appno', '');
        oDetailModel.setProperty('/FormData/ZappStatAl', '');
        this.settingsAttachTable();
      },

      // 임시저장
      onSaveBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const sAppno = oDetailModel.getProperty('/FormData/Appno');
        const mFormData = oDetailModel.getProperty('/FormData');

        if (this.checkError()) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
          title: this.getBundleText('LABEL_09010'),
          actions: [this.getBundleText('LABEL_00103'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00103')) {
              try {
                AppUtils.setAppBusy(true, this);

                if (!sAppno) {
                  const sAppno = await Appno.get.call(this);

                  oDetailModel.setProperty('/FormData/Appno', sAppno);
                  oDetailModel.setProperty('/FormData/Appda', new Date());
                }

                let oSendObject = {};

                oSendObject = mFormData;
                oSendObject.Prcty = 'T';
                oSendObject.Menid = oDetailModel.getProperty('/menid');
                oSendObject.Waers = 'KRW';
                oSendObject.MedExpenseItemSet = oDetailModel.getProperty('/HisList');
                // FileUpload
                if (!!AttachFileAction.getFileCount.call(this)) {
                  await AttachFileAction.uploadFile.call(this, mFormData.Appno, this.getApprovalType());
                }

                const aHislist = oDetailModel.getProperty('/HisList');

                if (!!aHislist.length && !!this.byId('DetailHisDialog')) {
                  await aHislist.forEach((e) => {
                    AttachFileAction.uploadFile.call(this, e.Appno2, this.getApprovalType(), this.DIALOG_FILE_ID);
                  });
                }

                const aDeleteDatas = oDetailModel.getProperty('/RemoveFiles');

                if (!!aDeleteDatas.length) {
                  await aDeleteDatas.forEach((e) => {
                    AttachFileAction.deleteFile(e.Appno2, this.getApprovalType());
                  });
                }

                await new Promise((resolve, reject) => {
                  oModel.create('/MedExpenseApplSet', oSendObject, {
                    success: () => {
                      resolve();
                    },
                    error: (oError) => {
                      reject(new ODataCreateError({ oError }));
                    },
                  });
                });

                MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00103'));
              } catch (oError) {
                AppUtils.handleError(oError);
              } finally {
                AppUtils.setAppBusy(false, this);
              }
            }
          },
        });
      },

      // 신청
      onApplyBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const sAppno = oDetailModel.getProperty('/FormData/Appno');
        const mFormData = oDetailModel.getProperty('/FormData');

        if (this.checkError()) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00121'), {
          title: this.getBundleText('LABEL_09010'),
          actions: [this.getBundleText('LABEL_00121'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00121')) {
              try {
                AppUtils.setAppBusy(true, this);

                if (!sAppno) {
                  const sAppno = await Appno.get.call(this);

                  oDetailModel.setProperty('/FormData/Appno', sAppno);
                  oDetailModel.setProperty('/FormData/Appda', new Date());
                }

                let oSendObject = {};

                oSendObject = mFormData;
                oSendObject.Prcty = 'C';
                oSendObject.Menid = oDetailModel.getProperty('/menid');
                oSendObject.Waers = 'KRW';
                oSendObject.MedExpenseItemSet = oDetailModel.getProperty('/HisList');

                // FileUpload
                if (!!AttachFileAction.getFileCount.call(this)) {
                  await AttachFileAction.uploadFile.call(this, mFormData.Appno, this.getApprovalType());
                }

                const aHislist = oDetailModel.getProperty('/HisList');

                if (!!aHislist.length && !!this.byId('DetailHisDialog')) {
                  await aHislist.forEach((e) => {
                    AttachFileAction.uploadFile.call(this, e.Appno2, this.getApprovalType(), this.DIALOG_FILE_ID);
                  });
                }

                const aDeleteDatas = oDetailModel.getProperty('/RemoveFiles');

                if (!!aDeleteDatas.length) {
                  await aDeleteDatas.forEach((e) => {
                    AttachFileAction.deleteFile(e.Appno2, this.getApprovalType());
                  });
                }

                await new Promise((resolve, reject) => {
                  oModel.create('/MedExpenseApplSet', oSendObject, {
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

      // 취소
      onCancelBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00118'), {
          title: this.getBundleText('LABEL_09010'),
          actions: [this.getBundleText('LABEL_00114'), this.getBundleText('LABEL_00118')],
          onClose: (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00114')) {
              AppUtils.setAppBusy(true, this);

              let oSendObject = {};

              oSendObject = oDetailModel.getProperty('/FormData');
              oSendObject.Prcty = 'W';
              oSendObject.Menid = oDetailModel.getProperty('/menid');

              oModel.create('/MedExpenseApplSet', oSendObject, {
                success: () => {
                  AppUtils.setAppBusy(false, this);
                  MessageBox.alert(this.getBundleText('MSG_00039', 'LABEL_00121'), {
                    onClose: () => {
                      this.onNavBack();
                    },
                  });
                },
                error: (oError) => {
                  AppUtils.handleError(new ODataCreateError({ oError }));
                  AppUtils.setAppBusy(false, this);
                },
              });
            }
          },
        });
      },

      // 삭제
      onDeleteBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00110'), {
          title: this.getBundleText('LABEL_09010'),
          actions: [this.getBundleText('LABEL_00110'), this.getBundleText('LABEL_00118')],
          onClose: (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00110')) {
              AppUtils.setAppBusy(true, this);

              const sPath = oModel.createKey('/MedExpenseApplSet', {
                Appno: oDetailModel.getProperty('/FormData/Appno'),
              });

              oModel.remove(sPath, {
                success: () => {
                  AppUtils.setAppBusy(false, this);
                  MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00110'), {
                    onClose: () => {
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
          Editable: !sStatus || sStatus === '10',
          Type: this.getApprovalType(),
          Appno: sAppno,
          Max: 10,
          FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'png'],
        });
      },
    });
  }
);
