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

    return BaseController.extend('sap.ui.yesco.mvc.controller.carMaintainCost.CarMaintainCostDetail', {
      AttachFileAction: AttachFileAction,
      TextUtils: TextUtils,
      TableUtils: TableUtils,
      FragmentEvent: FragmentEvent,

      initializeModel() {
        return {
          Hass: this.isHass(),
          minDate: moment().toDate(),
          maxDate: moment().toDate(),
          DatePickLabel: '',
          FormData: {
            Fixed: true,
            bPayType: false,
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
        };
      },

      async onObjectMatched(oParameter) {
        const sDataKey = oParameter.oDataKey;
        const sStatKey = oParameter.sStatus;
        const oDetailModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.BENEFIT);

        oDetailModel.setData(this.initializeModel());
        oDetailModel.setProperty('/busy', true);

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
          let sMsg = `<p>${this.getBundleText('MSG_25004')}</p>
          <p>${this.getBundleText('MSG_25018')}</p>`;

          oDetailModel.setProperty('/InfoMessage', sMsg);

          const sEname = this.getAppointeeProperty('Ename');
          const dMoment = moment();
          let dMinDate = '';
          let dMaxDate = '';
          let sDatePickLabel = '';

          if (sDataKey === 'N' || !sDataKey) {
            const [oTargetData] = await Client.getEntitySet(oModel, 'MaintenanceCarChange', {
              Pernr: sPernr,
            });

            if (!!oTargetData.Pernr) {
              if (oTargetData.Appty === 'I') {
                dMinDate = moment('10000101').toDate();
                dMaxDate = dMoment.toDate();
                sDatePickLabel = this.getBundleText('LABEL_25021'); // 지원시작일
              } else {
                const iYear = dMoment.year();
                const sDate = dMoment.date() === 1 ? moment(`${iYear}${_.padStart(dMoment.month() + 1, 2, '0')}`).toDate() : moment(`${iYear}${_.padStart(dMoment.month() + 2, 2, '0')}`).toDate();

                dMinDate = dMoment.toDate();
                dMaxDate = moment('99991231').toDate();
                sDatePickLabel = this.getBundleText('LABEL_25014'); // 차량등록일/변경일
                oTargetData.Cardt = sDate;
              }

              oTargetData.Cc = oTargetData.Cc.replace(/^0+/, '');
              oTargetData.Caryr = oTargetData.Caryr.replace(/^0+/, '');
              oTargetData.Id = oTargetData.Id.replace(/^0+/, '');

              oDetailModel.setProperty('/FormData', oTargetData);
              oDetailModel.setProperty('/FormData/Ename', sEname);
              oDetailModel.setProperty('/FormData/Fixed', oTargetData.Appty !== 'D' && (!oTargetData.ZappStatAl || oTargetData.ZappStatAl === '10'));
              oDetailModel.setProperty('/FormData/bPayType', oTargetData.Payty !== 'PAY');
              oDetailModel.setProperty('/minDate', dMinDate);
              oDetailModel.setProperty('/maxDate', dMaxDate);
              oDetailModel.setProperty('/DatePickLabel', sDatePickLabel);
              oDetailModel.setProperty('/ApplyInfo', oTargetData);
              oDetailModel.setProperty('/ApprovalDetails', oTargetData);
            } else {
              const mSessionData = this.getSessionData();
              const sAppCode = mMaintainType[0].Zcode;

              oDetailModel.setProperty('/FormData', {
                Ename: sEname,
                Fixed: sAppCode !== 'D',
                bPayType: false,
                Pernr: sPernr,
                Appty: sAppCode,
                Payorg: 'ALL',
                Idtype: 'ALL',
                Payty: 'ALL',
                Bankl: 'ALL',
              });
              oDetailModel.setProperty('/minDate', moment('10000101').toDate());
              oDetailModel.setProperty('/maxDate', moment().toDate());
              oDetailModel.setProperty('/DatePickLabel', this.getBundleText('LABEL_25021')); //지원시작일

              oDetailModel.setProperty('/ApplyInfo', {
                Apename: mSessionData.Ename,
                Aporgtx: `${mSessionData.Btrtx} / ${mSessionData.Orgtx}`,
                Apjikgbtl: `${mSessionData.Zzjikgbt} / ${mSessionData.Zzjikcht}`,
              });
            }
          } else {
            const [oTargetData] = await Client.getEntitySet(oModel, 'MaintenanceCarAppl', {
              Prcty: 'D',
              Appno: sDataKey,
            });

            if (oTargetData.Appty === 'I') {
              dMinDate = moment('10000101').toDate();
              dMaxDate = dMoment.toDate();
            } else {
              dMinDate = dMoment.toDate();
              dMaxDate = moment('99991231').toDate();
            }

            oDetailModel.setProperty('/FormData', oTargetData);
            oDetailModel.setProperty('/minDate', dMinDate);
            oDetailModel.setProperty('/maxDate', dMaxDate);
            oDetailModel.setProperty('/DatePickLabel', this.getBundleText('LABEL_25021')); // 지원시작일
            oDetailModel.setProperty('/FormData/Ename', sEname);
            oDetailModel.setProperty('/FormData/Fixed', oTargetData.Appty !== 'D' && oTargetData.ZappStatAl === '10');
            oDetailModel.setProperty('/FormData/bPayType', oTargetData.Payty !== 'PAY');
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
        return 'HR14';
      },

      getCurrentLocationText(oArguments) {
        const sAction = oArguments.oDataKey === 'N' ? this.getBundleText('LABEL_04002') : this.getBundleText('LABEL_00165');

        return sAction;
      },

      // 배기량, 년식 숫자입력
      onNumberTxt(oEvent) {
        const oEventSource = oEvent.getSource();
        const sPath = oEventSource.getBinding('value').getPath();
        const sValue = _.trimStart(oEvent.getParameter('value'), '0').replace(/[^\d]/g, '');

        oEventSource.setValue(sValue);
        oEventSource.getModel().setProperty(sPath, sValue);
      },

      // 지정계좌번호 입력
      onAccountTxt(oEvent) {
        const oEventSource = oEvent.getSource();
        const sPath = oEventSource.getBinding('value').getPath();
        const sValue = oEvent
          .getParameter('value')
          .trim()
          .replace(/[^\d || -]/g, '');

        oEventSource.setValue(sValue);
        oEventSource.getModel().setProperty(sPath, sValue);
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

          // 보험가입
          if (!mFormData.Insu) {
            MessageBox.alert(this.getBundleText('MSG_25017'));
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

          oDetailModel.setProperty('/FormData/Cc', !mFormData.Cc || '0');
          oDetailModel.setProperty('/FormData/Caryr', !mFormData.Caryr || '0');
          oDetailModel.setProperty('/FormData/Id', !mFormData.Id || '0');
        }

        return false;
      },

      // 재작성
      onRewriteBtn() {
        const oDetailModel = this.getViewModel();
        const bFixed = oDetailModel.getProperty('/FormData/Appty') !== 'D';

        oDetailModel.setProperty('/FormData/ZappStatAl', '');
        oDetailModel.setProperty('/FormData/Fixed', bFixed);
        oDetailModel.setProperty('/ApplyInfo/Appdt', '');
        this.settingsAttachTable();
        oDetailModel.setProperty('/FormData/Appno', '');
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

              const oModel = this.getModel(ServiceNames.BENEFIT);
              let oSendObject = {
                ...mFormData,
                Prcty: 'T',
                Menid: this.getCurrentMenuId(),
              };

              await Client.create(oModel, 'MaintenanceCarAppl', oSendObject);

              // FileUpload
              if (!!AttachFileAction.getFileCount.call(this)) {
                await AttachFileAction.uploadFile.call(this, mFormData.Appno, this.getApprovalType());
              }

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

            const oDetailModel = this.getViewModel();

            try {
              AppUtils.setAppBusy(true, this);

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

              const oModel = this.getModel(ServiceNames.BENEFIT);

              await Client.create(oModel, 'MaintenanceCarAppl', oSendObject);

              // FileUpload
              if (!!AttachFileAction.getFileCount.call(this)) {
                await AttachFileAction.uploadFile.call(this, mFormData.Appno, this.getApprovalType());
              }

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
          Message: this.getBundleText('MSG_00040'),
          Max: 10,
          // FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'xls', 'xlsx', 'bmp', 'png'],
        });
      },
    });
  }
);
