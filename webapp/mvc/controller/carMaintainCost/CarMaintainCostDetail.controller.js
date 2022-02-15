/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
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
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date',
    'sap/ui/yesco/mvc/model/type/Currency',
  ],
  (
    // prettier 방지용 주석
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
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.carMaintainCost.CarMaintainCostDetail', {
      AttachFileAction: AttachFileAction,
      TextUtils: TextUtils,
      TableUtils: TableUtils,
      FragmentEvent: FragmentEvent,

      onBeforeShow() {
        const oViewModel = new JSONModel({
          Hass: this.isHass(),
          FormData: {
            Fixed: true,
            bPayType: true,
          },
          FieldLimit: {},
          BankList: [],
          MaintainType: [],
          LicenseType: [],
          AppDept: [],
          PayType: [],
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
        const sStatKey = oParameter.sStatus;
        const oDetailModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.BENEFIT);

        try {
          // Input Field Imited
          oDetailModel.setProperty('/FieldLimit', _.assignIn(this.getEntityLimit(ServiceNames.BENEFIT, 'MaintenanceCarAppl')));

          const mBankList = await Client.getEntitySet(oModel, 'BenefitCodeList', { Cdnum: 'BE0019' });

          // 지정은행
          oDetailModel.setProperty('/BankList', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: mBankList }));

          const dDatum = new Date();
          const sPernr = this.getAppointeeProperty('Pernr');
          // 신청구분
          const mMaintainType = await Client.getEntitySet(oModel, 'BenefitCodeList', {
            Pernr: sPernr,
            Cdnum: !!sStatKey && sStatKey !== '10' ? 'BE0023' : 'BE0020',
            Datum: dDatum,
          });

          oDetailModel.setProperty('/MaintainType', mMaintainType);

          // 운전면허종별
          const sWerks = this.getAppointeeProperty('Werks');
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
            Pernr: sPernr,
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

          const sEname = this.getAppointeeProperty('Ename');

          if (sDataKey === 'N' || !sDataKey) {
            const mSessionData = this.getSessionData();
            const sAppCode = mMaintainType[0].Zcode;

            oDetailModel.setProperty('/FormData', {
              Ename: sEname,
              Fixed: sAppCode !== 'D',
              bPayType: true,
              Appty: sAppCode,
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
            const oTargetData = await Client.getEntitySet(oModel, 'MaintenanceCarAppl', {
              Prcty: 'D',
              Appno: sDataKey,
            });

            oDetailModel.setProperty('/FormData', oTargetData[0]);
            oDetailModel.setProperty('/FormData/Ename', sEname);
            oDetailModel.setProperty('/FormData/Fixed', oTargetData[0].Appty !== 'D' && oTargetData[0].ZappStatAl === '10');
            oDetailModel.setProperty('/FormData/bPayType', oTargetData[0].Payty !== 'PAY');
            oDetailModel.setProperty('/ApplyInfo', oTargetData[0]);
            oDetailModel.setProperty('/ApprovalDetails', oTargetData[0]);
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
        let bEdit = false;

        switch (sKey) {
          case 'I':
          case 'U':
            bEdit = true;
            break;
          case 'D':
            bEdit = false;
            break;
        }

        oDetailModel.setProperty('/FormData/Fixed', bEdit);
        this.settingsAttachTable();
      },

      // 지급방식
      onPayType(oEvent) {
        const oDetailModel = this.getViewModel();
        const sKey = oEvent.getSource().getSelectedKey();

        if (sKey === 'ALL') {
          return;
        }

        let bType = '';

        if (sKey === 'PAY') {
          bType = false;
        } else {
          bType = true;
        }

        oDetailModel.setProperty('/FormData/bPayType', bType);
      },

      // 보험가입
      onCheckBox(oEvent) {
        const oDetailModel = this.getViewModel();
        const bSelected = oEvent.getSource().getSelected();
        let sKey = '';

        if (bSelected) {
          sKey = 'X';
        } else {
          sKey = '';
        }

        oDetailModel.setProperty('/FormData/Insu', sKey);
      },

      checkError() {
        const oDetailModel = this.getViewModel();
        const mFormData = oDetailModel.getProperty('/FormData');

        if (mFormData.Fixed) {
          // 신청부서/업무
          if (mFormData.Payorg === 'ALL' || !mFormData.Payorg) {
            MessageBox.alert(this.getBundleText('MSG_25005'));
            return true;
          }

          // 차량번호
          if (!mFormData.Carno) {
            MessageBox.alert(this.getBundleText('MSG_25007'));
            return true;
          }

          // 차종
          if (!mFormData.Carty) {
            MessageBox.alert(this.getBundleText('MSG_25008'));
            return true;
          }

          // 배기량
          if (!mFormData.Cc) {
            MessageBox.alert(this.getBundleText('MSG_25009'));
            return true;
          }

          // 년식
          if (!mFormData.Caryr) {
            MessageBox.alert(this.getBundleText('MSG_25010'));
            return true;
          }

          // 차량등록일
          if (!mFormData.Cardt) {
            MessageBox.alert(this.getBundleText('MSG_25011'));
            return true;
          }

          // 운전면허번호
          if (!mFormData.Id) {
            MessageBox.alert(this.getBundleText('MSG_25012'));
            return true;
          }

          // 운전면허종별
          if (mFormData.Idtype === 'ALL' || !mFormData.Idtype) {
            MessageBox.alert(this.getBundleText('MSG_25013'));
            return true;
          }

          // 지급방식
          if (mFormData.Payty === 'ALL' || !mFormData.Payty) {
            MessageBox.alert(this.getBundleText('MSG_25014'));
            return true;
          }

          // 지정은행
          if ((mFormData.Bankl === 'ALL' || !mFormData.Bankl) && mFormData.bPayType) {
            MessageBox.alert(this.getBundleText('MSG_25015'));
            return true;
          }

          // 지정계좌번호
          if (!mFormData.Bankn && mFormData.bPayType) {
            MessageBox.alert(this.getBundleText('MSG_25016'));
            return true;
          }

          // 첨부파일
          if (mFormData.Fixed && !AttachFileAction.getFileCount.call(this)) {
            MessageBox.alert(this.getBundleText('MSG_00046'));
            return true;
          }
        } else {
          // 해지일(지원종료일)
          if (!mFormData.Expdt) {
            MessageBox.alert(this.getBundleText('MSG_25006'));
            return true;
          }
        }

        return false;
      },
      // 재작성
      onRewriteBtn() {
        const oDetailModel = this.getViewModel();
        const bFixed = oDetailModel.getProperty('/FormData/Appty') !== 'D';

        oDetailModel.setProperty('/FormData/Appno', '');
        oDetailModel.setProperty('/FormData/Fixed', bFixed);
        oDetailModel.setProperty('/FormData/ZappStatAl', '');
        this.settingsAttachTable();
      },

      // 임시저장
      onSaveBtn() {
        if (this.checkError()) return;

        // {저장}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
          // 저장, 취소
          actions: [this.getBundleText('LABEL_00103'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            // 저장
            if (!vPress || vPress !== this.getBundleText('LABEL_00103')) {
              return;
            }

            const oDetailModel = this.getViewModel();
            const sAppno = oDetailModel.getProperty('/FormData/Appno');

            try {
              AppUtils.setAppBusy(true, this);

              if (!sAppno) {
                const sAppno = await Appno.get.call(this);

                oDetailModel.setProperty('/FormData/Appno', sAppno);
                oDetailModel.setProperty('/FormData/Appda', new Date());
              }

              const mFormData = oDetailModel.getProperty('/FormData');

              // FileUpload
              if (!!AttachFileAction.getFileCount.call(this)) {
                await AttachFileAction.uploadFile.call(this, mFormData.Appno, this.getApprovalType());
              }

              const oModel = this.getModel(ServiceNames.BENEFIT);
              let oSendObject = {
                ...mFormData,
                Prcty: 'T',
                Menid: this.getCurrentMenuId(),
              };

              await Client.create(oModel, 'MaintenanceCarAppl', oSendObject);

              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00103')); // {저장}되었습니다.
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              AppUtils.setAppBusy(false, this);
            }
          },
        });
      },

      // 신청
      onApplyBtn() {
        if (this.checkError()) return;

        // {신청}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00121'), {
          // 신청, 취소
          actions: [this.getBundleText('LABEL_00121'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            // 신청
            if (!vPress || vPress !== this.getBundleText('LABEL_00121')) {
              return;
            }

            try {
              AppUtils.setAppBusy(true, this);

              const oDetailModel = this.getViewModel();
              const sAppno = oDetailModel.getProperty('/FormData/Appno');

              if (!sAppno) {
                const sAppno = await Appno.get.call(this);

                oDetailModel.setProperty('/FormData/Appno', sAppno);
                oDetailModel.setProperty('/FormData/Appda', new Date());
              }

              const mFormData = oDetailModel.getProperty('/FormData');
              let oSendObject = {
                ...mFormData,
                Prcty: 'C',
                Menid: oDetailModel.getProperty('/menid'),
              };

              // FileUpload
              if (!!AttachFileAction.getFileCount.call(this)) {
                await AttachFileAction.uploadFile.call(this, mFormData.Appno, this.getApprovalType());
              }

              const oModel = this.getModel(ServiceNames.BENEFIT);

              await Client.create(oModel, 'MaintenanceCarAppl', oSendObject);

              // {신청}되었습니다.
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

            AppUtils.setAppBusy(true, this);

            try {
              const oDetailModel = this.getViewModel();
              const oModel = this.getModel(ServiceNames.BENEFIT);

              await Client.remove(oModel, 'MaintenanceCarAppl', { Appno: oDetailModel.getProperty('/FormData/Appno') });

              // {삭제}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00110'), {
                onClose: () => {
                  this.onNavBack();
                },
              });
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              AppUtils.setAppBusy(false, this);
            }
          },
        });
      },

      // AttachFileTable Settings
      settingsAttachTable() {
        const oDetailModel = this.getViewModel();
        const sStatus = oDetailModel.getProperty('/FormData/ZappStatAl');
        const bFixed = oDetailModel.getProperty('/FormData/Appty') !== 'D';
        const sAppno = oDetailModel.getProperty('/FormData/Appno') || '';

        AttachFileAction.setAttachFile(this, {
          Editable: !sStatus || sStatus === '10',
          Visible: bFixed,
          Type: this.getApprovalType(),
          Appno: sAppno,
          Max: 10,
          FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'png'],
        });
      },
    });
  }
);
