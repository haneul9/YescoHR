/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
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

    return BaseController.extend('sap.ui.yesco.mvc.controller.accountChange.mobile.AccountChangeDetail', {
      AttachFileAction: AttachFileAction,
      TextUtils: TextUtils,
      TableUtils: TableUtils,
      FragmentEvent: FragmentEvent,

      initializeModel() {
        return {
          Hass: this.isHass(),
          FormData: {},
          FieldLimit: {},
          AccType: [{ Zcode: 'A', Ztext: this.getBundleText('LABEL_26014') }],
          BankList: [],
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
        };
      },

      async onObjectMatched(oParameter) {
        const sDataKey = oParameter.oDataKey;
        const oDetailModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.PAY);

        oDetailModel.setData(this.initializeModel());
        oDetailModel.setProperty('/busy', true);

        try {
          // Input Field Imited
          oDetailModel.setProperty('/FieldLimit', _.assignIn(this.getEntityLimit(ServiceNames.PAY, 'BankAccount')));

          // 변경은행
          const aBankList = await Client.getEntitySet(oModel, 'BanklCodeList');

          oDetailModel.setProperty('/BankList', new ComboEntry({ codeKey: 'Bankl', valueKey: 'Banka', aEntries: aBankList }));

          if (sDataKey === 'N' || !sDataKey) {
            const mSessionData = this.getSessionData();
            const mAppointeeData = this.getAppointeeData();

            const mMyAccPayLoad = {
              Menid: this.getCurrentMenuId(),
              Pernr: mAppointeeData.Pernr,
            };
            // 나의 계좌정보
            const [mMyAcc] = await Client.getEntitySet(oModel, 'CurrentAcctInfo', mMyAccPayLoad);

            oDetailModel.setProperty('/FormData', {
              Pernr: mAppointeeData.Pernr,
              Acctty: 'A',
              Bankl: 'ALL',
              Begym: moment().format('YYYYMM'),
              PayYearMon: moment().format('YYYY-MM'),
              BankaBef: _.get(mMyAcc, 'Banka'),
              BanklBef: _.get(mMyAcc, 'Bankl'),
              BanknBef: _.get(mMyAcc, 'Bankn'),
            });

            oDetailModel.setProperty('/ApplyInfo', {
              Apename: mSessionData.Ename,
              Aporgtx: `${mSessionData.Btrtx} / ${mSessionData.Orgtx}`,
              Apjikgbtl: `${mSessionData.Zzjikgbt} / ${mSessionData.Zzjikcht}`,
            });
          } else {
            const [oTargetData] = await Client.getEntitySet(oModel, 'BankAccount', {
              Appno: sDataKey,
            });

            oTargetData.PayYearMon = `${oTargetData.Begym.slice(0, 4)}-${oTargetData.Begym.slice(4)}`;

            oDetailModel.setProperty('/FormData', oTargetData);
            oDetailModel.setProperty('/ApplyInfo', oTargetData);
            oDetailModel.setProperty('/ApprovalDetails', oTargetData);
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
        return 'HR16';
      },

      getCurrentLocationText(oArguments) {
        const sAction = oArguments.oDataKey === 'N' ? this.getBundleText('LABEL_04002') : this.getBundleText('LABEL_00165');

        return sAction;
      },

      // 계좌구분 선택
      onAccChange() {
        const oDetailModel = this.getViewModel();

        oDetailModel.setProperty('/FormData/Chkyn', '');
        oDetailModel.setProperty('/FormData/Bankl', 'ALL');
        oDetailModel.setProperty('/FormData/Bankn', '');
      },

      // 변경된 은행선택
      onBankList() {
        const oDetailModel = this.getViewModel();

        oDetailModel.setProperty('/FormData/Chkyn', '');
      },

      // 계좌실명확인 Btn
      async onAccNameCheck() {
        if (this.checkError()) return;

        try {
          const oDetailModel = this.getViewModel();
          const mFormData = oDetailModel.getProperty('/FormData');
          const oModel = this.getModel(ServiceNames.PAY);
          const mPayLoad = {
            Menid: this.getCurrentMenuId(),
            Pernr: this.getAppointeeProperty('Pernr'),
            Bankl: mFormData.Bankl,
            Bankn: mFormData.Bankn,
          };
          // 실명확인
          const [{ Chkyn }] = await Client.getEntitySet(oModel, 'CheckAccount', mPayLoad);

          oDetailModel.setProperty('/FormData/Chkyn', Chkyn);

          if (Chkyn === 'X') {
            MessageBox.alert(this.getBundleText('MSG_26007')); // 확인되었습니다.
          }
        } catch (oError) {
          AppUtils.handleError(oError);
        }
      },

      // 지급년월
      onDatePick(oEvent) {
        const oDetailModel = this.getViewModel();
        const dDateValue = oEvent.getSource().getDateValue();

        oDetailModel.setProperty('/FormData/PayYearMon', moment(dDateValue).format('YYYY-MM'));
        oDetailModel.setProperty('/FormData/Begym', moment(dDateValue).format('YYYYMM'));
      },

      // 변경된 은행계좌입력시
      onAccChangeInput() {
        const oDetailModel = this.getViewModel();

        oDetailModel.setProperty('/FormData/Chkyn', '');
      },

      checkError(sType) {
        const oDetailModel = this.getViewModel();
        const mFormData = oDetailModel.getProperty('/FormData');

        // 변경은행
        if (mFormData.Bankl === 'ALL' || !mFormData.Bankl) {
          MessageBox.alert(this.getBundleText('MSG_26004'));
          return true;
        }

        // 변경계좌
        if (!mFormData.Bankn) {
          MessageBox.alert(this.getBundleText('MSG_26005'));
          return true;
        }

        // 계좌실명확인
        if (sType === 'C' && mFormData.Chkyn !== 'X') {
          MessageBox.alert(this.getBundleText('MSG_26006'));
          return true;
        }

        // 첨부파일
        if (sType === 'C' && !AttachFileAction.getFileCount.call(this)) {
          MessageBox.alert(this.getBundleText('MSG_00046'));
          return true;
        }

        return false;
      },

      // 신청
      onApplyBtn() {
        if (this.checkError('C')) return;

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
                oDetailModel.setProperty('/FormData/Appdt', new Date());
              }

              const mFormData = oDetailModel.getProperty('/FormData');

              // FileUpload
              if (!!AttachFileAction.getFileCount.call(this)) {
                await AttachFileAction.uploadFile.call(this, mFormData.Appno, this.getApprovalType());
              }

              const oModel = this.getModel(ServiceNames.PAY);
              let oSendObject = {
                ...mFormData,
                Menid: this.getCurrentMenuId(),
              };

              await Client.create(oModel, 'BankAccount', oSendObject);

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
              const oModel = this.getModel(ServiceNames.PAY);

              await Client.remove(oModel, 'BankAccount', { Appno: oDetailModel.getProperty('/FormData/Appno') });

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
        const sAppno = oDetailModel.getProperty('/FormData/Appno') || '';

        AttachFileAction.setAttachFile(this, {
          Editable: !sStatus,
          Type: this.getApprovalType(),
          Appno: sAppno,
          Max: 10,
          // FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'txt', 'png'],
        });
      },
    });
  }
);
