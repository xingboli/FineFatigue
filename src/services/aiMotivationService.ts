import { MotivationMessage } from '../types';
import { DEMO_MODE } from '../config/runtime';

export type FatigueLevelTier = 'optimal' | 'mild' | 'moderate' | 'high' | 'severe';

export interface MotivationRequest {
  overallScore: number; // 0 to 100
  stabilityScore?: number;
  tappingScore?: number;
  reactionScore?: number;
  tracingScore?: number;
  subjectiveRating?: number; // 1 to 10
  language?: 'zh' | 'en';
}

interface LocalAdviceDatabase {
  zh: Record<FatigueLevelTier, MotivationMessage[]>;
  en: Record<FatigueLevelTier, MotivationMessage[]>;
}

const LOCAL_ADVICE_DB: LocalAdviceDatabase = {
  zh: {
    optimal: [
      {
        id: 'OPT-ZH-1',
        tier: 'optimal',
        title: '神经肌肉调控处于巅峰状态',
        message: '你的指尖微动极其平稳，连续交替敲击节奏保持在极低变异系数（CV），反应潜伏期处于极高敏捷区间！当前的神经募集效率与运动耐力非常充沛。',
        subtext: '适合开展对手部精细操作、高频输入要求极高的精密实验与任务。',
        category: 'praise',
        recoveryAction: {
          actionTitle: '维持最佳竞技状态',
          drillDuration: '1 分钟温和舒展',
          steps: [
            '保持当前用手握持姿态，避免过度用力握持设备',
            '双手手指自然张开微伸展 5 秒，重复 2 次',
            '注意呼吸节奏，维持大脑皮层运动区的专注度'
          ]
        },
        source: 'local_rule_engine'
      },
      {
        id: 'OPT-ZH-2',
        tier: 'optimal',
        title: '精细运动控制与节奏稳定性极佳',
        message: '阿基米德螺旋描摹的均方根偏差（RMSE）非常低，几乎未出现路径卡顿。这种精准的本体感觉和手眼协调能力令人赞叹！',
        subtext: '连续测试中几乎未检测到性能衰退（Performance Decrement）。',
        category: 'encouragement',
        recoveryAction: {
          actionTitle: '微运动放松指引',
          drillDuration: '30 秒指尖轻触',
          steps: [
            '双手拇指与食指、中指依次快速对捏轻触',
            '保持手腕中立位，避免长时间悬空'
          ]
        },
        source: 'local_rule_engine'
      }
    ],
    mild: [
      {
        id: 'MLD-ZH-1',
        tier: 'mild',
        title: '轻度肌肉疲劳适应期，控制力依旧在线',
        message: '在后段手指交替敲击中检测到轻微的按键间隔拉长，这是手部骨间肌在负荷积累下的正常生理调控反应。你的阿基米德螺旋描摹平滑度依然保持在高水准！',
        subtext: '轻度疲劳是运动耐力训练的有益阶段，不用担心。',
        category: 'encouragement',
        recoveryAction: {
          actionTitle: '肌腱微张力舒缓',
          drillDuration: '2 分钟指关节拉伸',
          steps: [
            '双臂向前平举，手掌朝外，用另一只手轻柔向后扳指尖 10 秒',
            '换手重复，感受指深屈肌群的舒适拉伸感',
            '做 10 次手指快速张合，促进微循环'
          ]
        },
        source: 'local_rule_engine'
      },
      {
        id: 'MLD-ZH-2',
        tier: 'mild',
        title: '动作节奏微幅放缓，整体控制依旧均衡',
        message: '视觉刺激反应潜伏期轻度延长约 15~25ms，说明中枢神经冲动发放速率出现自然波动。你依然平稳地完成了全部测试！',
        subtext: '适当补充水分并稍作眼部放松，即可快速恢复最佳敏捷度。',
        category: 'comfort',
        recoveryAction: {
          actionTitle: '手腕顺时针轻转',
          drillDuration: '1 分钟腕部环绕',
          steps: [
            '双手握空心拳，顺时针缓慢画圈 5 次',
            '逆时针缓慢画圈 5 次，消除腕管微压力'
          ]
        },
        source: 'local_rule_engine'
      }
    ],
    moderate: [
      {
        id: 'MOD-ZH-1',
        tier: 'moderate',
        title: '辛苦了！双手进入典型负荷平台期',
        message: '高频交替运动带来了明显的神经肌肉负荷消耗，敲击速率在最后 5 秒出现了阶梯式衰退，三轴加速度计记录到微动振幅略有升高。这正是高负荷运动实验的典型数据特征，你的坚持非常有价值！',
        subtext: '请给予双手充分的喘息时间，不要勉强连续进行高强度测试。',
        category: 'comfort',
        recoveryAction: {
          actionTitle: '前臂与掌心间歇舒缓法',
          drillDuration: '3 分钟放松间歇',
          steps: [
            '将手平放在桌面上，用对侧拇指轻柔打圈按揉大鱼际肌与小鱼际肌',
            '顺着前臂内侧向手腕方向轻轻梳理抚摩，缓解肌张力',
            '深吸气，双肩下沉，让小臂与腕部完全处于支撑状态'
          ]
        },
        source: 'local_rule_engine'
      },
      {
        id: 'MOD-ZH-2',
        tier: 'moderate',
        title: '运动耐力受耗，适时休整能帮助肌力回升',
        message: '连续高频交互让手部快速动作单元（Fast Twitch Units）出现疲劳募集，出现短暂停顿是肌体保护性神经抑制的体现，证明负荷诱发非常充分。你做得很棒！',
        subtext: '休息 5 分钟后再次测量，即可观察到显著的疲劳恢复动力学曲线。',
        category: 'comfort',
        recoveryAction: {
          actionTitle: '掌部自然下垂温和抖动',
          drillDuration: '2 分钟血流活化',
          steps: [
            '双臂自然下垂于身侧，轻柔摆动手腕 15 秒',
            '双掌相对轻搓至掌心温热，轻抚手背'
          ]
        },
        source: 'local_rule_engine'
      }
    ],
    high: [
      {
        id: 'HGH-ZH-1',
        tier: 'high',
        title: '深度疲劳诱发，给指尖一个温暖的缓冲间隔',
        message: '数据呈现出显著的动作减速与微动偏移增大，表明手部屈指深浅肌群已达到高负荷耗竭点。感谢你为实验提供了极其宝贵的高应激态对照数据！现在请完全停下指尖动作，让双手好好休息。',
        subtext: '任何疲劳都是暂时的，充足的微运动休息会带来更强的耐力适应。',
        category: 'comfort',
        recoveryAction: {
          actionTitle: '深度肌腱滑动与完全静息',
          drillDuration: '5 分钟系统休息',
          steps: [
            '立即离开键盘与屏幕，双臂完全支撑于桌面或大腿上',
            '温和进行“直立手掌 - 爪状屈指 - 握拳 - 展平”肌腱滑动练习 3 组',
            '闭目深呼吸 3 次，感受手腕与小臂紧张感的释放'
          ]
        },
        source: 'local_rule_engine'
      }
    ],
    severe: [
      {
        id: 'SVR-ZH-1',
        tier: 'severe',
        title: '极限神经肌肉负荷已达成，立即进入充分休整',
        message: '无论是敲击间隔、路径跟踪还是微动震颤指标均显示双手处于深度疲劳抑制状态。你已经全力以赴完成了挑战，这是一组极具科研对比价值的极限负荷数据！现在最重要的是彻底放松双臂。',
        subtext: '请放下手机与操作设备，喝一口温水，休息 10 分钟以上。',
        category: 'comfort',
        recoveryAction: {
          actionTitle: '温热敷与温和静态伸展',
          drillDuration: '10 分钟彻底恢复',
          steps: [
            '双臂放松下垂，避免任何敲击或打字动作',
            '可用温毛巾或温水温和冲洗手腕和掌心，促进局部代谢物排出',
            '轻柔抚触前臂肌群，保持良好坐姿与呼吸'
          ]
        },
        source: 'local_rule_engine'
      }
    ]
  },
  en: {
    optimal: [
      {
        id: 'OPT-EN-1',
        tier: 'optimal',
        title: 'Peak Neuromuscular Performance & Fine Control',
        message: 'Your micro-motion stability is exceptionally steady, inter-tap intervals maintain an impressively low coefficient of variation, and your reaction latency is razor-sharp! Motor reserves are robust.',
        subtext: 'Ideal neurological state for tasks demanding high dexterity and rapid motor tempo.',
        category: 'praise',
        recoveryAction: {
          actionTitle: 'Peak Performance Maintenance',
          drillDuration: '1 min gentle stretch',
          steps: [
            'Maintain ergonomic hand alignment and loose grip',
            'Gently spread fingers open for 5 seconds, repeat twice',
            'Breathe evenly to sustain motor cortex focus'
          ]
        },
        source: 'local_rule_engine'
      }
    ],
    mild: [
      {
        id: 'MLD-EN-1',
        tier: 'mild',
        title: 'Mild Neuromuscular Fatigue, Control Still Agile',
        message: 'A slight elongation in inter-tap interval was captured during the final sector, which is a textbook physiological adaptation to repetitive motor loading. Tracing smoothness remains exemplary!',
        subtext: 'Mild fatigue is a natural, healthy phase of motor endurance assessment.',
        category: 'encouragement',
        recoveryAction: {
          actionTitle: 'Tendon Tension Release',
          drillDuration: '2 min tendon glides',
          steps: [
            'Extend arm forward, palm up, gently pull fingertips backward for 10s',
            'Switch hands and repeat to ease flexor muscle tension',
            'Flick fingers open and closed 10 times to boost micro-circulation'
          ]
        },
        source: 'local_rule_engine'
      }
    ],
    moderate: [
      {
        id: 'MOD-EN-1',
        tier: 'moderate',
        title: 'Well Done! Your Hands Have Entered the Fatigue Plateau',
        message: 'Repetitive high-tempo tapping has depleted immediate motor unit reserves, leading to noticeable performance decrement in the final 5s. This provides pristine experimental contrast data!',
        subtext: 'Give your hands adequate downtime before commencing another test battery.',
        category: 'comfort',
        recoveryAction: {
          actionTitle: 'Forearm & Palm Decompression',
          drillDuration: '3 min respite',
          steps: [
            'Rest hands flat on a tabletop and massage the thenar eminence',
            'Gently glide down the inner forearm to release myofascial strain',
            'Inhale deeply and drop shoulders away from ears'
          ]
        },
        source: 'local_rule_engine'
      }
    ],
    high: [
      {
        id: 'HGH-EN-1',
        tier: 'high',
        title: 'Significant Motor Load Induced, Time to Rest',
        message: 'Notable deceleration and micro-motion deviation confirm your deep and superficial flexors have reached high physiological fatigue. Thank you for logging such rigorous stress-state data!',
        subtext: 'Resting hands and fingers now will allow rapid recuperation.',
        category: 'comfort',
        recoveryAction: {
          actionTitle: 'Complete Passive Arm Rest',
          drillDuration: '5 min passive reset',
          steps: [
            'Step away from screens and input devices',
            'Let arms hang loosely at sides and gently sway wrists for 15s',
            'Rest palms comfortably in lap with loose fingers'
          ]
        },
        source: 'local_rule_engine'
      }
    ],
    severe: [
      {
        id: 'SVR-EN-1',
        tier: 'severe',
        title: 'Maximal Fatigue Challenge Reached, Step Back & Recover',
        message: 'Both rhythm consistency and trajectory smoothness reflect substantial neuromuscular exhaustion. You gave this challenge your absolute best! Please take a well-deserved 10-minute break.',
        subtext: 'Hydrate, step away from interactive controls, and let circulation restore energy.',
        category: 'comfort',
        recoveryAction: {
          actionTitle: 'Thermal Comfort & Rest',
          drillDuration: '10 min comprehensive recovery',
          steps: [
            'Stop all manual keyboard or device tapping immediately',
            'Apply warm water or gentle towel wrap to soothe hand tendons',
            'Relax breathing and avoid high-dexterity demands'
          ]
        },
        source: 'local_rule_engine'
      }
    ]
  }
};

export class AiMotivationService {
  /**
   * Determine fatigue tier from assessment score or subjective rating
   */
  static determineTier(score: number): FatigueLevelTier {
    // Subjective self-rating is an independent experimental observation. It is
    // intentionally excluded from objective fatigue scoring and AI tiering.
    if (score >= 82) return 'optimal';
    if (score >= 68) return 'mild';
    if (score >= 52) return 'moderate';
    if (score >= 38) return 'high';
    return 'severe';
  }

  /**
   * Get personalized advice. Attempts the configured LAN AI endpoint, otherwise
   * falls back gracefully to targeted local domain rules.
   */
  static async getAdvice(request: MotivationRequest): Promise<MotivationMessage> {
    const lang = request.language || 'zh';
    const tier = this.determineTier(request.overallScore);

    if (DEMO_MODE) {
      return this.getLocalTargetedAdvice(tier, lang);
    }

    // The same-origin LAN endpoint owns the provider configuration and key.
    try {
      const llmResult = await this.callLlmApi(request, tier);
      if (llmResult) {
        return llmResult;
      }
    } catch (err) {
      // Graceful fallback to local targeted rule engine as requested
    }

    return this.getLocalTargetedAdvice(tier, lang);
  }

  /**
   * Local rule engine that provides targeted, varied advice based on tier
   */
  static getLocalTargetedAdvice(tier: FatigueLevelTier, lang: 'zh' | 'en' = 'zh'): MotivationMessage {
    const list = LOCAL_ADVICE_DB[lang]?.[tier] || LOCAL_ADVICE_DB.zh[tier] || LOCAL_ADVICE_DB.zh.moderate;
    const picked = list[Math.floor(Math.random() * list.length)];
    return { ...picked };
  }

  /**
   * Same-origin LAN AI interface.
   */
  private static async callLlmApi(request: MotivationRequest, tier: FatigueLevelTier): Promise<MotivationMessage | null> {
    // The LAN server owns the MiMo key. The browser only sends the minimal
    // assessment context to its same-origin endpoint and never sees the key.
    const endpoint = '/api/ai/motivation';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s quick timeout

    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...request, tier }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!resp.ok) return null;
      const data = await resp.json();
      if (data && data.message) {
        return {
          id: `LLM-${Date.now()}`,
          tier,
          title: data.title || 'AI 实时疲劳关怀建议',
          message: data.message,
          subtext: data.subtext || '基于多模态运动衰减特征分析生成',
          category: data.category || 'comfort',
          recoveryAction: data.recoveryAction || {
            actionTitle: '个性化放松指引',
            drillDuration: '2 分钟舒展',
            steps: ['深呼吸放松', '手腕顺时针轻柔旋转 5 次']
          },
          source: 'llm_api'
        };
      }
    } catch (e) {
      clearTimeout(timeoutId);
      // Fallback
    }

    return null;
  }
}
