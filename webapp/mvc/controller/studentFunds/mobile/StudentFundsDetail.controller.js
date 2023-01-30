/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    Appno,
    AppUtils,
    ComboEntry,
    Client,
    ServiceNames,
    MessageBox,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.studentFunds.mobile.StudentFundsDetail', {
      initializeModel() {
        return {
          previousName: '',
          menId: '',
          AmountRate: 0,
          FormData: {
            Forsch: '',
            ZappStatAl: 'XX',
          },
          AppTarget: [],
          AcademicSort: [],
          GradeList: [],
          QuarterList: [],
          Settings: {},
          busy: false,
          LimitAmountMSG: false,
          MajorInput: false,
        };
      },

      getCurrentLocationText() {
        return this.getBundleText('LABEL_00195', 'LABEL_03001'); // {학자금} 신청
      },

      getPreviousRouteName() {
        return this.getViewModel().getProperty('/previousName');
      },

      async onObjectMatched({ oDataKey }, sRouteName) {
        const oViewModel = this.getViewModel();
        const sMenid = this.getCurrentMenuId();

        oViewModel.setData(this.initializeModel());

        try {
          oViewModel.setProperty('/busy', true);
          oViewModel.setProperty('/Menid', sMenid);
          // Input Field Imited
          oViewModel.setProperty('/FieldLimit', _.assignIn(this.getEntityLimit(ServiceNames.BENEFIT, 'SchExpenseAppl')));
          oViewModel.setProperty('/previousName', _.chain(sRouteName).split('-', 1).head().value());

          // 각 코드 호출
          const [aAppList, aAcademicList, aGradeList] = await this.getList();

          oViewModel.setProperty('/AppTarget', new ComboEntry({ codeKey: 'Zzobjps', valueKey: 'Znametx', aEntries: aAppList }));
          oViewModel.setProperty('/AcademicSortHide', aAcademicList);
          oViewModel.setProperty('/AcademicSort', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aAcademicList }));
          oViewModel.setProperty('/GradeList', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aGradeList }));

          this.getTargetData(oDataKey);
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 화면관련 List호출
      async getList() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const sWerks = this.getSessionProperty('Werks');
        const sPernr = this.getAppointeeProperty('Pernr');
        const oDate = new Date();

        return Promise.all([
          // 신청대상 조회
          Client.getEntitySet(oModel, 'SchExpenseSupportList', {
            Datum: oDate,
            Pernr: sPernr,
          }),
          // 학력구분 조회
          Client.getEntitySet(oModel, 'BenefitCodeList', {
            Cdnum: 'BE0006',
            Werks: sWerks,
            Pernr: sPernr,
            Datum: oDate,
          }),
          // 학년 조회
          Client.getEntitySet(oModel, 'BenefitCodeList', {
            Cdnum: 'BE0004',
            Grcod: 'BE000002',
            Sbcod: 'GRADE',
            Werks: sWerks,
            Pernr: sPernr,
            Datum: oDate,
          }),
        ]);
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR02';
      },

      // 해외학교 체크시
      async onSelectForeign(oEvent) {
        const bSelected = oEvent.getSource().getSelected();
        const oViewModel = this.getViewModel();

        try {
          if (bSelected) {
            oViewModel.setProperty('/FormData/Forsch', 'X');

            const [oList] = await this.getSupAmount();

            oViewModel.setProperty('/LimitAmount', oList);
          } else {
            oViewModel.setProperty('/FormData/Forsch', '');
          }

          this.totalCost();
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 학자금 총액에 들어가는 금액입력
      liveChangeCost(oEvent) {
        this.TextUtils.liveChangeCurrency(oEvent);
        this.totalCost();
      },

      // 장학금 입력시
      onSchoCost(oEvent) {
        this.TextUtils.liveChangeCurrency(oEvent);
      },

      // 지원금액 호출
      async getSupAmount() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oViewModel = this.getViewModel();
        const mFormData = oViewModel.getProperty('/FormData');
        const mFilters = _.pick(mFormData, ['Slart', 'Zname', 'Zzobjps', 'Grdsp', 'Zyear']);

        return Client.getEntitySet(oModel, 'SchExpenseLimitAmt', _.set(mFilters, 'Pernr', this.getAppointeeProperty('Pernr')));
      },

      // 학자금 총액
      totalCost() {
        const oViewModel = this.getViewModel();
        const mFormData = oViewModel.getProperty('/FormData');
        const oLimitData = oViewModel.getProperty('/LimitAmount');
        const iCostA = parseInt(mFormData.ZbetEntr) || 0;
        const iCostB = parseInt(mFormData.ZbetMgmt) || 0;
        const iCostC = parseInt(mFormData.ZbetClass) || 0;
        const iCostD = parseInt(mFormData.ZbetExer) || 0;
        const iCostE = parseInt(mFormData.ZbetSuf) || 0;
        const iCostF = parseInt(mFormData.ZbetEtc) || 0;
        const iCostG = iCostA + iCostB + iCostC + iCostD + iCostE + iCostF;

        oViewModel.setProperty('/FormData/ZbetTotl', String(iCostG));

        const iCostH = _.multiply(iCostG, _.divide(oViewModel.getProperty('/AmountRate'), 100));
        let sAmt = '';
        let bMSG = false;

        if (mFormData.Forsch === 'X') {
          if (!!oLimitData && iCostH > _.parseInt(oLimitData.Zbetrg)) {
            if (mFormData.Grdsp !== 'ALL' && mFormData.Divcd !== 'ALL') {
              sAmt = oLimitData.Zbetrg;
              bMSG = true;
            }
          } else {
            sAmt = String(iCostH);
          }
        } else {
          sAmt = String(iCostH);
        }

        oViewModel.setProperty('/FormData/ZpayAmt', sAmt);
        oViewModel.setProperty('/LimitAmountMSG', bMSG);
      },

      // 상세조회
      async getTargetData(sAppno = '') {
        const oViewModel = this.getViewModel();
        const mSessionData = this.getSessionData();
        const mAppointeeData = this.getAppointeeData();

        if (sAppno === 'N' || !sAppno) {
          oViewModel.setProperty('/QuarterList', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext' }));
          oViewModel.setProperty('/FormData', {
            Apename: mSessionData.Ename,
            Appernr: mSessionData.Pernr,
            Ename: mAppointeeData.Ename,
            Pernr: mAppointeeData.Pernr,
            Zzobjps: 'ALL',
            Slart: 'ALL',
            Grdsp: 'ALL',
            Divcd: 'ALL',
            Zyear: String(new Date().getFullYear()),
          });

          oViewModel.setProperty('/ApplyInfo', {
            Apename: mSessionData.Ename,
            Aporgtx: `${mSessionData.Btrtx} / ${mSessionData.Orgtx}`,
            Apjikgbtl: `${mSessionData.Zzjikgbt} / ${mSessionData.Zzjikcht}`,
          });

          this.setYearsList();
          this.settingsAttachTable();
        } else {
          const oModel = this.getModel(ServiceNames.BENEFIT);
          const sPernr = this.getAppointeeProperty('Pernr');
          const mPayLoad = {
            Prcty: 'D',
            Appno: sAppno,
            Pernr: sPernr,
          };

          // 대상자리스트
          const [oTargetData] = await Client.getEntitySet(oModel, 'SchExpenseAppl', mPayLoad);

          _.each(oViewModel.getProperty('/AppTarget'), (e) => {
            if (e.Zname === oTargetData.Zname) {
              oTargetData.Zzobjps = e.Zzobjps;
            }
          });

          const { Zzobjps, Slart, Grdsp } = oTargetData;
          oTargetData.Zzobjpstx = _.chain(oViewModel.getProperty('/AppTarget'))
            .find((m) => m.Zzobjps === Zzobjps)
            .get('Znametx')
            .value();
          oTargetData.Slarttx = _.chain(oViewModel.getProperty('/AcademicSort'))
            .find((m) => m.Zcode === Slart)
            .get('Ztext')
            .value();
          oTargetData.Grdsptx = _.chain(oViewModel.getProperty('/GradeList'))
            .find((m) => m.Zcode === Grdsp)
            .get('Ztext')
            .value();

          oViewModel.setProperty('/FormData', oTargetData);
          oViewModel.setProperty('/ApplyInfo', oTargetData);
          oViewModel.setProperty('/ApprovalDetails', oTargetData);
          this.onChangeSchool();
          this.setYearsList();
          this.reflashList(oTargetData.Zzobjps);
          this.settingsAttachTable();

          if (oTargetData.Forsch === 'X' && _.parseInt(oTargetData.ZbetTotl) >= _.parseInt(oTargetData.ZpayAmt)) {
            oViewModel.setProperty('/LimitAmountMSG', true);
          }
        }
      },

      // 학자금 발생년도 셋팅
      async setYearsList() {
        const oViewModel = this.getViewModel();
        const iFullYears = new Date().getFullYear();
        const aYearsList = [];

        aYearsList.push({ Zcode: String(iFullYears), Ztext: `${iFullYears}년` }, { Zcode: String(iFullYears - 1), Ztext: `${iFullYears - 1}년` });

        oViewModel.setProperty('/FundsYears', aYearsList);

        try {
          if (!oViewModel.getProperty('/FormData/ZappStatAl')) {
            oViewModel.setProperty('/FormData/Zyear', aYearsList[0].Zcode);

            const [oList] = await this.getSupAmount();

            oViewModel.setProperty('/LimitAmount', oList);
            this.totalCost();
          }
          const sZyear = oViewModel.getProperty('/FormData/Zyear');
          const sZyeartx = _.chain(aYearsList)
            .find((m) => m.Zcode === sZyear)
            .get('Ztext')
            .value();
          oViewModel.setProperty('/FormData/Zyeartx', sZyeartx);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 신청대상 선택시
      onChangeTarget(oEvent) {
        const oEventSource = oEvent.getSource();
        setTimeout(async () => {
          const sSelectedKey = oEventSource.getSelectedKey();
          const oViewModel = this.getViewModel();

          if (sSelectedKey === 'ALL') {
            return;
          }

          try {
            this.reflashList(sSelectedKey);

            const sSlartKey = oViewModel.getProperty('/FormData/Slart');

            if (sSlartKey === '05' || sSlartKey === '06') {
              oViewModel.setProperty('/MajorInput', true);
            } else {
              oViewModel.setProperty('/MajorInput', false);
            }

            oViewModel.setProperty('/FormData/Schtx', '');
            oViewModel.setProperty('/FormData/Majnm', '');
            oViewModel.setProperty('/FormData/Slart', 'ALL');
            oViewModel.setProperty('/FormData/Divcd', 'ALL');

            const [oList] = await this.getSupAmount();

            oViewModel.setProperty('/LimitAmount', oList);
            this.totalCost();
            this.getApplyNumber();
          } catch (oError) {
            AppUtils.handleError(oError);
          } finally {
            oViewModel.setProperty('/busy', false);
          }
        }, 500);
      },

      // 학력구분List 다시셋팅
      async reflashList(sKey) {
        const oViewModel = this.getViewModel();
        const aList1 = oViewModel.getProperty('/AcademicSortHide');
        let aList2 = [];

        try {
          if (sKey === '00') {
            const oModel = this.getModel(ServiceNames.BENEFIT);
            const mPayLoad = {
              Cdnum: 'BE0006',
              Werks: this.getAppointeeProperty('Werks'),
              Datum: new Date(),
              Grcod: 'BE000002',
              Sbcod: 'BONIN',
            };
            // 학력구분 호출
            const aStuList = await Client.getEntitySet(oModel, 'BenefitCodeList', mPayLoad);

            if (!oViewModel.getProperty('/FormData/ZappStatAl')) {
              const aList = await this.getQuarterList(aStuList[0].Zcode);

              oViewModel.setProperty('/QuarterList', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aList }));
            }

            aList2 = aStuList;
          } else {
            aList2 = aList1;
          }

          oViewModel.setProperty('/AcademicSort', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aList2 }));
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 지원횟수 조회
      async getApplyNumber() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oViewModel = this.getViewModel();
        const mFormData = oViewModel.getProperty('/FormData');
        const mFilters = _.pick(mFormData, ['Zname', 'Slart', 'Zzobjps']);

        try {
          oViewModel.getProperty('/AppTarget').forEach((e) => {
            if (e.Zzobjps === mFormData.Zzobjps) {
              oViewModel.setProperty('/FormData/Kdsvh', e.Kdsvh);
              oViewModel.setProperty('/FormData/Zname', e.Zname);
            }
          });

          const [oList] = await Client.getEntitySet(oModel, 'SchExpenseCnt', _.set(mFilters, 'Pernr', this.getAppointeeProperty('Pernr')));

          oViewModel.setProperty('/FormData/Cnttx', oList.Cnttx);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 학자금 발생년도 클릭
      async onChangeYear() {
        const oViewModel = this.getViewModel();

        try {
          this.getApplyNumber();

          const [oList] = await this.getSupAmount();

          oViewModel.setProperty('/LimitAmount', oList);
          this.totalCost();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      async onChangeGrade() {
        const oViewModel = this.getViewModel();

        try {
          const [oList] = await this.getSupAmount();

          oViewModel.setProperty('/LimitAmount', oList);
          this.totalCost();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 학력구분 선택시
      onChangeSchool(oEvent) {
        const oViewModel = this.getViewModel();
        setTimeout(async () => {
          const vSelected = oViewModel.getProperty('/FormData/Slart');
          if (vSelected === 'ALL') {
            return;
          }

          try {
            const sStatus = oViewModel.getProperty('/FormData/ZappStatAl');
            if (!sStatus || sStatus === '10') {
              oViewModel.setProperty('/MajorInput', vSelected === '05' || vSelected === '06');

              if (!!oEvent) {
                oViewModel.setProperty('/FormData/Schtx', '');
                oViewModel.setProperty('/FormData/Majnm', '');
              }
            }

            const sZchar1 = _.chain(oViewModel.getProperty('/AcademicSort'))
              .find((e) => vSelected === e.Zcode)
              .get('Zchar1')
              .value();
            oViewModel.setProperty('/AmountRate', sZchar1);

            const [oList] = await this.getSupAmount();
            oViewModel.setProperty('/LimitAmount', oList);

            if (!!oEvent) {
              this.getApplyNumber();
              this.totalCost();
            }

            const aList = await this.getQuarterList(vSelected);
            oViewModel.setProperty('/QuarterList', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aList }));

            if (!!oEvent) {
              oViewModel.setProperty('/FormData/Divcd', 'ALL');
            }

            const sDivcd = oViewModel.getProperty('/FormData/Divcd');
            const sDivcdtx = _.chain(oViewModel.getProperty('/QuarterList'))
              .find((e) => e.Zcode === sDivcd)
              .get('Ztext')
              .value();
            oViewModel.setProperty('/FormData/Divcdtx', sDivcdtx);
          } catch (oError) {
            AppUtils.handleError(oError);
          }
        }, 500);
      },

      // 분기/학기
      async getQuarterList(sUpcod) {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const mFilters = {
          // prettier 방지주석
          Cdnum: 'BE0005',
          Werks: this.getSessionProperty('Werks'),
          Datum: new Date(),
          Upcod: sUpcod,
          Pernr: this.getAppointeeProperty('Pernr'),
        };

        return await Client.getEntitySet(oModel, 'BenefitCodeList', mFilters);
      },

      checkError(AppBtn) {
        const oViewModel = this.getViewModel();
        const mFormData = oViewModel.getProperty('/FormData');

        oViewModel.setProperty('/FormData/ZbetSuf', !mFormData.ZbetSuf ? '0' : mFormData.ZbetSuf);

        // 신청대상
        if (mFormData.Zzobjps === 'ALL' || !mFormData.Zzobjps) {
          MessageBox.alert(this.getBundleText('MSG_03007'));
          return true;
        }

        // 학력구분
        if (mFormData.Slart === 'ALL' || !mFormData.Slart) {
          MessageBox.alert(this.getBundleText('MSG_03008'));
          return true;
        }

        // 학년
        if (mFormData.Grdsp === 'ALL' || !mFormData.Grdsp) {
          MessageBox.alert(this.getBundleText('MSG_03009'));
          return true;
        }

        // 분기/학기
        if (mFormData.Divcd === 'ALL' || !mFormData.Divcd) {
          MessageBox.alert(this.getBundleText('MSG_03010'));
          return true;
        }

        // 학교명
        if (!mFormData.Schtx) {
          MessageBox.alert(this.getBundleText('MSG_03003'));
          return true;
        }

        // 지원금액 > 0
        if (!parseInt(mFormData.ZpayAmt) && AppBtn === 'O') {
          MessageBox.alert(this.getBundleText('MSG_03004'));
          return true;
        }

        if (!mFormData.ZbetClass) {
          oViewModel.setProperty('/FormData/ZbetClass', '0');
        }

        const sWerks = this.getAppointeeProperty('Werks');

        if (!(sWerks === '2000' && (mFormData.Slart === '03' || mFormData.Slart === '04'))) {
          // 첨부파일
          if (!this.AttachFileAction.getFileCount.call(this) && AppBtn === 'O') {
            MessageBox.alert(this.getBundleText('MSG_03005')); // 신청 시 첨부파일은 필수입니다. 업로드 후 신청하시기 바랍니다.
            return true;
          }
        }

        return false;
      },

      // 재작성
      onRewriteBtn() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/FormData/Appno', '');
        oViewModel.setProperty('/FormData/ZappStatAl', null);
        this.settingsAttachTable();
        this.onChangeSchool();
      },

      // 임시저장
      onSaveBtn() {
        if (this.checkError()) return;

        // {저장}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
          actions: [
            this.getBundleText('LABEL_00118'), // 취소
            this.getBundleText('LABEL_00103'), // 저장
          ],
          onClose: async (vPress) => {
            // 저장
            if (!vPress || vPress !== this.getBundleText('LABEL_00103')) {
              return;
            }

            AppUtils.setAppBusy(true);

            try {
              const oViewModel = this.getViewModel();
              const mFormData = oViewModel.getProperty('/FormData');

              if (!mFormData.Appno) {
                const sAppno = await Appno.get.call(this);

                _.chain(oViewModel.getProperty('/FormData')).set('Appno', sAppno).set('Appdt', new Date()).commit();
              }

              // FileUpload
              await this.AttachFileAction.uploadFile.call(this, mFormData.Appno, this.getApprovalType());

              const oModel = this.getModel(ServiceNames.BENEFIT);
              const mSendObject = {
                ...mFormData,
                Prcty: 'T',
                Menid: oViewModel.getProperty('/Menid'),
                Waers: 'KRW',
              };

              await Client.create(oModel, 'SchExpenseAppl', mSendObject);

              // {저장}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00103'));
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              AppUtils.setAppBusy(false);
            }
          },
        });
      },

      // 신청
      onApplyBtn() {
        if (this.checkError('O')) return;

        // {신청}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00121'), {
          actions: [
            this.getBundleText('LABEL_00118'), // 취소
            this.getBundleText('LABEL_00121'), // 신청
          ],
          onClose: async (vPress) => {
            // 신청
            if (!vPress || vPress !== this.getBundleText('LABEL_00121')) {
              return;
            }

            AppUtils.setAppBusy(true);

            try {
              const oViewModel = this.getViewModel();
              const mFormData = oViewModel.getProperty('/FormData');

              if (!mFormData.Appno) {
                const sAppno = await Appno.get.call(this);

                _.chain(mFormData).set('Appno', sAppno).set('Appdt', new Date()).commit();
              }

              const mSendObject = {
                ...mFormData,
                Prcty: 'C',
                Menid: oViewModel.getProperty('/Menid'),
                Waers: 'KRW',
              };

              // FileUpload
              await this.AttachFileAction.uploadFile.call(this, mFormData.Appno, this.getApprovalType());

              const oModel = this.getModel(ServiceNames.BENEFIT);

              await Client.create(oModel, 'SchExpenseAppl', mSendObject);

              // {신청}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00121'), {
                onClose: () => {
                  this.onNavBack();
                },
              });
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              AppUtils.setAppBusy(false);
            }
          },
        });
      },

      // 신청취소
      onCancelBtn() {
        // {신청취소}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00122'), {
          actions: [
            this.getBundleText('LABEL_00118'), // 취소
            this.getBundleText('LABEL_00114'), // 확인
          ],
          onClose: async (vPress) => {
            // 확인
            if (!vPress || vPress !== this.getBundleText('LABEL_00114')) {
              return;
            }

            AppUtils.setAppBusy(true);

            try {
              const oViewModel = this.getViewModel();
              const mSendObject = {
                ...oViewModel.getProperty('/FormData'),
                Prcty: 'W',
                Menid: oViewModel.getProperty('/Menid'),
              };

              const oModel = this.getModel(ServiceNames.BENEFIT);

              await Client.create(oModel, 'SchExpenseAppl', mSendObject);

              // {신청}이 취소되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00039', 'LABEL_00121'), {
                onClose: () => {
                  this.onNavBack();
                },
              });
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              AppUtils.setAppBusy(false);
            }
          },
        });
      },

      // 삭제
      onDeleteBtn() {
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00110'), {
          actions: [
            this.getBundleText('LABEL_00118'), // 취소
            this.getBundleText('LABEL_00110'), // 삭제
          ],
          onClose: async (vPress) => {
            if (!vPress || vPress !== this.getBundleText('LABEL_00110')) {
              return;
            }

            AppUtils.setAppBusy(true);

            try {
              const oViewModel = this.getViewModel();
              const oModel = this.getModel(ServiceNames.BENEFIT);

              await Client.remove(oModel, 'SchExpenseAppl', { Appno: oViewModel.getProperty('/FormData/Appno') });

              // {취소}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00110'), {
                onClose: () => {
                  this.onNavBack();
                },
              });
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              AppUtils.setAppBusy(false);
            }
          },
        });
      },

      // AttachFileTable Settings
      settingsAttachTable() {
        const oViewModel = this.getViewModel();
        const mFormData = oViewModel.getProperty('/FormData');
        const sAppno = mFormData.Appno || '';

        this.AttachFileAction.setAttachFile(this, {
          Editable: !mFormData.ZappStatAl || mFormData.ZappStatAl === '10',
          Type: this.getApprovalType(),
          Appno: sAppno,
          Message: this.getBundleText('MSG_00040'), // 증빙자료를 꼭 등록하세요.
          Max: 10,
        });
      },

      reduceViewResource() {
        this.getViewModel().setProperty('/FormData/ZappStatAl', 'XX');
      },
    });
  }
);
