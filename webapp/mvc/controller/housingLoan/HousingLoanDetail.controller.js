/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    MessageBox,
    Appno,
    AppUtils,
    ComboEntry,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.housingLoan.HousingLoanDetail', {
      LIST_PAGE_ID: 'container-ehr---housingLoan',

      initializeModel() {
        return {
          menid: '',
          ViewKey: '',
          HideBox: true,
          FormData: {},
          baseArea: {},
          loanAmount: {},
          LaonType: [],
          AssuranceType: [],
          HouseType: [],
          Settings: {},
          RepayList: [],
          RepayHisList: [],
          RepayHisLength: 2,
          hisBusy: false,
          busy: false,
        };
      },
      onBeforeShow() {
        this.TableUtils.summaryColspan({ oTable: this.byId('repayHisTable'), aHideIndex: [1] });
      },

      async onObjectMatched(oParameter) {
        const sDataKey = oParameter.oDataKey;
        const sMenid = this.getCurrentMenuId();
        const oDetailModel = this.getViewModel();

        oDetailModel.setData(this.initializeModel());
        oDetailModel.setProperty('/menid', sMenid);
        oDetailModel.setProperty('/busy', true);
        oDetailModel.setProperty('/ViewKey', sDataKey);

        try {
          const mAppointeeData = this.getAppointeeData();
          const fCurriedGetEntitySet = Client.getEntitySet(this.getModel(ServiceNames.BENEFIT));
          const [a08Results, a09Results, a10Results, [m11Result]] = await Promise.all([
            fCurriedGetEntitySet('BenefitCodeList', {
              Werks: mAppointeeData.Werks,
              Datum: new Date(),
              Cdnum: 'BE0008',
              Grcod: 'BE000004',
              Sbcod: 'GRADE',
            }), //
            fCurriedGetEntitySet('BenefitCodeList', { Cdnum: 'BE0009' }),
            fCurriedGetEntitySet('BenefitCodeList', {
              Werks: mAppointeeData.Werks,
              Datum: new Date(),
              Cdnum: 'BE0010',
              Grcod: 'BE000003',
              Sbcod: 'HTYPE',
            }),
            fCurriedGetEntitySet('BenefitCodeList', {
              Werks: mAppointeeData.Werks,
              Datum: new Date(),
              Cdnum: 'BE0011',
              Grcod: 'BE000003',
              Sbcod: 'OUT',
              Comcd: 'PY',
            }),
          ]);

          oDetailModel.setProperty('/LaonType', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: _.filter(a08Results, (o) => !o.Zchar1) }));
          oDetailModel.setProperty('/AssuranceType', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: a09Results }));
          oDetailModel.setProperty('/HouseType', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: a10Results }));
          oDetailModel.setProperty('/baseArea/Text', _.get(m11Result, 'Zbigo'));
          oDetailModel.setProperty('/baseArea/Code', _.get(m11Result, 'Zchar1'));

          // Input Field Imited
          oDetailModel.setProperty('/FieldLimit', _.assignIn(this.getEntityLimit(ServiceNames.BENEFIT, 'LoanAmtAppl')));

          this.setFormData();
        } catch (oError) {
          this.debug('Controller > HousingLoanDetail > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oDetailModel.setProperty('/busy', false);
        }
      },

      getCurrentLocationText(oArguments) {
        const sAction = oArguments.oDataKey === 'N' ? this.getBundleText('LABEL_04002') : this.getBundleText('LABEL_00165');

        return sAction;
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR07';
      },

      // 상환이력 Excel
      onPressExcelDownload() {
        const oTable = this.byId('repayHisTable');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_07033');

        this.TableUtils.export({ oTable, sFileName });
      },

      // 융자금액 입력시
      loanCost(oEvent) {
        const oEventSource = oEvent.getSource();
        const sValue = oEvent.getParameter('value').trim().replace(/[^\d]/g, '');
        const oDetailModel = this.getViewModel();
        const sAmountCode = this.getViewModel().getProperty('/loanAmount/Code');
        const mFormData = oDetailModel.getProperty('/FormData');

        if (sValue > parseFloat(sAmountCode) && !!mFormData.Lntyp) {
          // const sAmountFormat = new Intl.NumberFormat('ko-KR').format(sAmountCode);
          const sFormAmount = new Intl.NumberFormat('ko-KR').format(mFormData.Lnamt);

          // MessageBox.alert(this.getBundleText('MSG_07006', mFormData.Lntyptx, sAmountFormat));
          this.getMonthlyRepayment(sValue);
          oEventSource.setValue(sFormAmount);
          return oDetailModel.setProperty('/FormData/Lnamt', mFormData.Lnamt);
        }

        oEventSource.setValue(sValue);
        oDetailModel.setProperty('/FormData/Lnamt', sValue);
        this.getMonthlyRepayment(sValue);
      },

      // 건평 입력시
      areaSize(oEvent) {
        const oDetailModel = this.getViewModel();
        let sValue = oEvent
          .getParameter('value')
          .trim()
          .replace(/[^\d'.']/g, '');

        if (_.includes(sValue, '.')) {
          const sReVal = sValue.replace(/['.']{2}/g, '.');
          const iIndex = sReVal.indexOf('.');

          sValue = sReVal.split('.')[0] + sReVal.slice(iIndex, iIndex + 3);
        } else {
          sValue = sValue.slice(0, 3);
        }

        // oEvent.getSource().setMaxLength(6);
        oDetailModel.setProperty('/FormData/Zsize', sValue);
        oEvent.getSource().setValue(sValue);
      },

      // 상세조회
      async setFormData() {
        const oDetailModel = this.getViewModel();
        const sViewKey = oDetailModel.getProperty('/ViewKey');

        oDetailModel.setProperty(
          '/InfoMessage',
          `<p>${this.getBundleText('MSG_07013')}</p>
          <p>${this.getBundleText('MSG_07005')}</p>`
        );

        if (sViewKey === 'N' || !sViewKey) {
          const mSessionData = this.getSessionData();

          oDetailModel.setProperty('/FormData/Appernr', mSessionData.Pernr);
          oDetailModel.setProperty('/FormData/Lntyp', 'ALL');
          oDetailModel.setProperty('/FormData/Asmtd', 'ALL');
          oDetailModel.setProperty('/FormData/Htype', 'ALL');

          oDetailModel.setProperty('/ApplyInfo', {
            Apename: mSessionData.Ename,
            Aporgtx: `${mSessionData.Btrtx} / ${mSessionData.Orgtx}`,
            Apjikgbtl: `${mSessionData.Zzjikgbt} / ${mSessionData.Zzjikcht}`,
          });

          this.settingsAttachTable();
        } else {
          oDetailModel.setProperty('/hisBusy', true);

          try {
            const oListView = this.getView().getParent().getPage(this.LIST_PAGE_ID);
            let mPayload = {};

            if (!!oListView && !!oListView.getModel().getProperty('/parameters')) {
              const mListData = oListView.getModel().getProperty('/parameters');

              mPayload.Begda = mListData.Begda;
              mPayload.Endda = mListData.Endda;
              mPayload.Lntyp = mListData.Lntyp;
              mPayload.Seqnr = mListData.Seqnr;
              mPayload.Pernr = mListData.Pernr;
            } else {
              mPayload.Appbox = 'X';
              mPayload.Pernr = this.getAppointeeProperty('Pernr');
              mPayload.Menid = this.getCurrentMenuId();
            }

            mPayload.Prcty = 'D';
            mPayload.Appno = sViewKey;
            mPayload.LoanAmtHistorySet = [];
            mPayload.LoanAmtRecordSet = [];

            const mDeepResult = await Client.deep(this.getModel(ServiceNames.BENEFIT), 'LoanAmtAppl', mPayload);

            oDetailModel.setProperty('/FormData', mDeepResult);
            oDetailModel.setProperty('/HideBox', this.isHideBox(mDeepResult.Lntyp));
            oDetailModel.setProperty('/ApplyInfo', {
              ...mDeepResult,
              Aporgtx: !mDeepResult.Aporgtx || mDeepResult.Aporgtx === '/' ? '' : mDeepResult.Aporgtx,
              Appdt: !mDeepResult.Appdt || _.parseInt(mDeepResult.Appdt.replaceAll('.', '').replaceAll(':', '').replaceAll(' ', '')) === 0 ? '' : mDeepResult.Appdt,
            });

            if (mDeepResult.Lnsta === '40' || mDeepResult.Lnsta === '60') {
              oDetailModel.setProperty('/RepayList', mDeepResult.LoanAmtHistorySet.results);
              oDetailModel.setProperty('/RepayHisList', mDeepResult.LoanAmtRecordSet.results);
              oDetailModel.setProperty('/RepayHisLength', Math.min(mDeepResult.LoanAmtRecordSet.results.length, 10));
            }

            this.settingsAttachTable();
            this.getLoanCost(mDeepResult.Lntyp);
          } catch (oError) {
            AppUtils.handleError(oError);
          } finally {
            oDetailModel.setProperty('/hisBusy', false);
          }
        }
      },

      // 융자금액입력시 금액호출
      async getLoanCost(sKey) {
        try {
          const oDetailModel = this.getViewModel();
          const [mResults] = await Client.getEntitySet(this.getModel(ServiceNames.BENEFIT), 'BenefitCodeList', {
            Werks: this.getAppointeeProperty('Werks'),
            Datum: new Date(),
            Cdnum: 'BE0012',
            Grcod: sKey,
          });

          oDetailModel.setProperty('/loanAmount/Code', _.get(mResults, 'Zbetrg'));
          oDetailModel.setProperty('/loanAmount/Text', _.get(mResults, 'Zbigo'));
          oDetailModel.setProperty('/FormData/Hdprd', _.get(mResults, 'Zchar2'));
          oDetailModel.setProperty('/FormData/Lnprd', _.get(mResults, 'Zchar1'));
          oDetailModel.setProperty('/FormData/Lnrte', _.get(mResults, 'Zchar5'));

          const mFormData = oDetailModel.getProperty('/FormData');

          if (!!mFormData.Lnamt) {
            if (parseFloat(mFormData.Lnamt) > parseFloat(_.get(mResults, 'Zbetrg'))) {
              MessageBox.alert(this.getBundleText('MSG_07006', mFormData.Lntyptx, new Intl.NumberFormat('ko-KR').format(_.get(mResults, 'Zbetrg')))); // {0} 은(는) {1}까지 신청 가능합니다.
              // oDetailModel.setProperty('/FormData/Lnamt', mResults.Zbetrg);
              // sAmount = mResults.Zbetrg;
            }
            // this.getMonthlyRepayment(sAmount);
          }
        } catch (oError) {
          this.debug('Controller > HousingLoanDetail > getLoanCost Error', oError);

          AppUtils.handleError(oError);
        }
      },

      // 신청서 출력
      async onAppPDF() {
        try {
          const mFormData = this.getViewModel().getProperty('/FormData');
          const [mResult] = await Client.getEntitySet(this.getModel(ServiceNames.BENEFIT), 'LoanAmtPrint', {
            ..._.pick(mFormData, ['Pernr', 'Begda', 'Endda', 'Lntyp']),
          });

          if (!_.isEmpty(mResult.Url)) window.open(mResult.Url, '_blank');
        } catch (oError) {
          this.debug('Controller > HousingLoanDetail > onAppPDF Error', oError);

          AppUtils.handleError(oError);
        }
      },

      // 융자구분이 LB(생활안전자금) || SB(주식매입자금)일 경우 Hide
      isHideBox(sKey = '') {
        let bHide = true;

        if (_.isEqual(sKey, 'SB') || _.isEqual(sKey, 'LB')) {
          bHide = false;
        }

        return bHide;
      },

      // 융자구분 선택시
      onLaonType(oEvent) {
        const oDetailModel = this.getViewModel();
        const sKey = oEvent.getSource().getSelectedKey();

        if (sKey === 'ALL' || !sKey) return;

        oDetailModel.setProperty('/HideBox', this.isHideBox(sKey));
        oDetailModel.getProperty('/LaonType').forEach((e) => {
          if (e.Zcode === sKey) {
            oDetailModel.setProperty('/FormData/Lntyptx', e.Ztext);
          }
        });

        this.getLoanCost(sKey);
      },

      // 융자금액 입력시 월 상환액
      async getMonthlyRepayment(sAmount) {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const mFormData = oDetailModel.getProperty('/FormData');

        if (mFormData.Lntyp === 'ALL' || !mFormData.Lntyp) return;

        const mPayLoad = {
          Lntyp: mFormData.Lntyp,
          Lnprd: mFormData.Lnprd || '',
          Lnrte: mFormData.Lnrte || '',
          LnamtT: sAmount,
        };

        try {
          const oRepayObj = await Client.getEntitySet(oModel, 'LoanAmtCheck', _.pickBy(mPayLoad, _.identity));

          if (!!oRepayObj[0].Message) {
            MessageBox.alert(oRepayObj[0].Message);
            // oDetailModel.setProperty('/FormData/Lnamt', oRepayObj[0].Mxamt);
          }

          oDetailModel.setProperty('/FormData/RpamtMon', oRepayObj[0].RpamtMon);
        } catch (oError) {
          AppUtils.handleError(oError);
        }
      },

      checkError() {
        const oDetailModel = this.getViewModel();
        const oFormData = oDetailModel.getProperty('/FormData');

        // 융자구분
        if (oFormData.Lntyp === 'ALL' || !oFormData.Lntyp) {
          MessageBox.alert(this.getBundleText('MSG_07007'));
          return true;
        }

        // 담보종류
        if (oFormData.Asmtd === 'ALL' || !oFormData.Asmtd) {
          MessageBox.alert(this.getBundleText('MSG_07008'));
          return true;
        }

        if (oDetailModel.getProperty('/HideBox')) {
          // 주택종류
          if (oFormData.Htype === 'ALL' || !oFormData.Htype) {
            MessageBox.alert(this.getBundleText('MSG_07009'));
            return true;
          }

          // 건평
          if (!oFormData.Zsize) {
            MessageBox.alert(this.getBundleText('MSG_07010'));
            return true;
          }

          // 주소
          if (!oFormData.Addre) {
            MessageBox.alert(this.getBundleText('MSG_07011'));
            return true;
          }
        }

        // 융자금액
        if (!oFormData.Lnamt) {
          MessageBox.alert(this.getBundleText('MSG_07012'));
          return true;
        }

        return false;
      },

      // 상환신청
      onRepayApp() {
        const sAppno = this.getViewModel().getProperty('/FormData/Appno');

        this.getRouter().navTo('housingLoan-repay', { oDataKey: sAppno });
      },

      // 재작성
      onRewriteBtn() {
        const oDetailModel = this.getViewModel();

        oDetailModel.setProperty('/FormData/Appno', '');
        oDetailModel.setProperty('/FormData/Lnsta', '');
        this.settingsAttachTable();
      },

      async createProcess({ sPrcty, sMessageCode, bNavBackComplete = false }) {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/busy', true);

        try {
          const mFormData = oViewModel.getProperty('/FormData');

          // 저장, 신청
          if (sPrcty !== 'W') {
            if (_.isEmpty(mFormData.Appno)) {
              mFormData.Appno = await Appno.get.call(this);

              oViewModel.setProperty('/FormData/Appno', mFormData.Appno);
              oViewModel.setProperty('/FormData/Appda', new Date());
            }

            // FileUpload
            await this.AttachFileAction.uploadFile.call(this, mFormData.Appno, this.getApprovalType());
          }

          const mCreateResult = await Client.create(this.getModel(ServiceNames.BENEFIT), 'LoanAmtAppl', {
            ...mFormData,
            Menid: this.getCurrentMenuId(),
            Prcty: sPrcty,
            Waers: sPrcty !== 'W' ? 'KRW' : null,
          });

          // 임시저장
          if (sPrcty === 'T') {
            if (!mFormData.Lnsta) {
              oViewModel.setProperty('/FormData/Begda', mCreateResult.Begda);
              oViewModel.setProperty('/FormData/Endda', mCreateResult.Endda);
              oViewModel.setProperty('/FormData/Pernr', mCreateResult.Pernr);
            }

            oViewModel.setProperty('/FormData/Lnsta', '10');
          }

          MessageBox.alert(this.getBundleText('MSG_00007', sMessageCode), {
            onClose: () => {
              oViewModel.setProperty('/busy', false);
              if (bNavBackComplete) this.onNavBack();
            },
          });
        } catch (oError) {
          this.debug('Controller > HousingLoanDetail > createProcess Error', oError);

          AppUtils.handleError(oError);
          oViewModel.setProperty('/busy', false);
        }
      },

      // 임시저장
      onSaveBtn() {
        if (this.checkError()) return;

        const sPrcty = 'T';
        const sMessageCode = 'LABEL_00103'; // 저장

        MessageBox.confirm(this.getBundleText('MSG_00006', sMessageCode), {
          actions: [this.getBundleText('LABEL_00103'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00103')) {
              this.createProcess({ sPrcty, sMessageCode });
            }
          },
        });
      },

      // 신청
      onApplyBtn() {
        if (this.checkError()) return;

        const sPrcty = 'C';
        const sMessageCode = 'LABEL_00121'; // 신청

        MessageBox.confirm(this.getBundleText('MSG_00006', sMessageCode), {
          actions: [this.getBundleText('LABEL_00121'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00121')) {
              this.createProcess({ sPrcty, sMessageCode, bNavBackComplete: true });
            }
          },
        });
      },

      // 취소
      onCancelBtn() {
        const sPrcty = 'W';
        const sMessageCode = 'LABEL_00118'; // 취소

        MessageBox.confirm(this.getBundleText('MSG_00006', sMessageCode), {
          actions: [this.getBundleText('LABEL_00114'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00114')) {
              this.createProcess({ sPrcty, sMessageCode, bNavBackComplete: true });
            }
          },
        });
      },

      // 삭제
      onDeleteBtn() {
        const oViewModel = this.getViewModel();

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00110'), {
          actions: [this.getBundleText('LABEL_00110'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00110')) {
              oViewModel.setProperty('/busy', true);

              try {
                const mFormData = this.getViewModel().getProperty('/FormData');

                await Client.remove(this.getModel(ServiceNames.BENEFIT), 'LoanAmtAppl', {
                  ..._.pick(mFormData, ['Pernr', 'Begda', 'Endda', 'Lntyp']),
                });

                MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00110'), {
                  onClose: () => {
                    this.onNavBack();
                    oViewModel.setProperty('/busy', false);
                  },
                });
              } catch (oError) {
                AppUtils.handleError(oError);
                oViewModel.setProperty('/busy', false);
              }
            }
          },
        });
      },

      // AttachFileTable Settings
      settingsAttachTable() {
        const oDetailModel = this.getViewModel();
        const sStatus = oDetailModel.getProperty('/FormData/Lnsta');
        const sAppno = oDetailModel.getProperty('/FormData/Appno') || '';

        this.AttachFileAction.setAttachFile(this, {
          Editable: !sStatus || sStatus === '10',
          Type: this.getApprovalType(),
          Appno: sAppno,
          Max: 10,
        });
      },
    });
  }
);
