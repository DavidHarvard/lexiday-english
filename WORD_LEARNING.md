# 单词学习与雅思词库更新（2026-10-30）

## 学习流程

新词按“裸词 → 例句 → 详解 → 听音输入 → 结果”进行。裸词自动读单词；例句和详解自动按顺序读单词与本轮例句。手动重播、页面切换与下一张卡片会取消旧的朗读队列，旧音频结束事件不能替新题解锁提交。

“有印象”“查看详解核对”只用于学习。听音阶段隐藏单词、例句原文和释义，要求输入中文，没有选择题选项。必须完整播放当前提示后才能提交；允许在单词读音和包含该词的例句之间切换，切换后重新播放。未通过则重新安排例句学习；同一天后续轮次使用下一条例句并再次听音输入。

普通新词需要一次有效听音输入；曾选择不认识或答错的词义需要在不同轮次累计三次正确。查看详解和重复提交不能增加次数。最后一次通过后才保存 `audioVerified: true` 并安排复习。

“完全记住”是用户主动排除整个词的独立操作：所有词义退出新学及复习队列。该标记随账号同步，可在学习报告中恢复。系统不会仅凭一次答对自动作出永久掌握标记。

到期复习继续使用读音、例句、拼写、文字例句四级提示，改为中文输入核对。听例句不再附送英文定义。尚未有首次听音通过记录的词，即使借助文字回答正确，也保持待复习；旧词已完成听音验证后仍可按原提示等级计算复习间隔。

## 中文输入判断

`dist/word-content.js` 规范化空格、全角标点、常见回答前缀，匹配教学释义中收录的同义表达，并接受形容词省略末尾“的”。多个答案必须全部属于有效释义；不使用包含子串的宽松判断，避免“不是住宅的”或混入无关答案也通过。

这是本地词库匹配，没有调用语义评分 API。未收录的自由改述可能判错，结果页会显示参考释义。扩展同义答案应补充经过核对的释义或 `extraAliases`，不能用自动判对兜底。导入词的裸音可接受该词已收录的不同含义；语境提示对应当前学习义项。原精选词若旧 ID 合并了几个含义，按当前实际例句对应拆分后的义项显示与判分，例如区分 bias 的统计偏差与主观偏见。

## 词库覆盖与兼容

雅思基础、进阶去重共 3,655 词，另补齐笔记中不在主词表的 25 个关联词。每个整理后的义项分开保存词性、中文释义、英文解释和至少两条独立中英例句。原精选词的例句保留，并检查上传词表中的额外含义。罕见、旧式或冒犯性用法在释义中标明。

`data/word-enrichment/part-*.jsonl` 是可维护源数据；`scripts/build-word-enrichment.mjs` 生成 `dist/word-enrichment.js` 及根目录镜像。正式构建要求 3,680 词全部存在，发现缺词、重复 ID、重复义项、例句缺失或明显占位句就失败。`--partial` 仅用于内容编写期间的本地预览，不用于发布。

原词 ID、3,686 个学习记录键以及用户账号快照格式保持兼容。新增的展示义项不强制重建旧的学习记录；导入词沿用 `import:word` 键，当前学习例句使用其首个教学义项，详解与笔记列出该词所有整理义项。已有精选词继续按原独立词义学习。这里的全词库覆盖指每个收录词有结构化教学内容，并不声称穷尽英语词典中所有历史或专业用法。

笔记按规范化英文词去重，合并关系标签和区别说明，因此 `resident` 即使来自“词族”和“同词族”也只出现一次。每个关联词的各词性、义项、例句与语境发音分别展示。读音不同的词性可单独存音标；播放对应例句帮助设备在语境中选择读音。声音由浏览器 `speechSynthesis` 提供，不是固定录制的词典音频。

每日阅读现已改为按今日词汇生成完整连贯文章，并提供完整主题文章备用；允许自然的复数、过去式等形式，实际覆盖率以正文为准。详见 [READING_AND_QUIZ.md](READING_AND_QUIZ.md)。原有独立的四选一课后听力题仍使用具备可靠干扰项的原题库；它不能替代新词的必需听音输入验证。

## 存储与验证

新增会话字段为 `protocol: typed-audio-v1`、`listenCue`、`listenPlayed`、`listenDraft`、`listenVerdict` 和相关错误状态。服务器校验接受并保留这些字段。旧的进行中新词自评计数会重新进入听音验证；旧版停留在复习详解页的未提交自评评级也会重新听音输入，不能直接获得新验证标记。已完成的记录、学习 ID 和其他模块数据不删除。

自动测试覆盖输入门槛、错误答案、同日例句轮换、三次强化、刷新恢复、旧快照兼容、账号跨客户端恢复、笔记去重和全词库例句覆盖。浏览器检查覆盖页面实际操作、无选项且隐藏答案、自动朗读调用次序、手机布局与排除标记。浏览器测试使用可控语音模拟，未录制用户设备实际扬声器输出。

维护命令：

```sh
node scripts/build-word-enrichment.mjs
node --test tests/*.test.mjs
node scripts/build-server.mjs
```

源词表与用户进度分别保存；补充词库作为公开静态资源部署，不写入用户 D1 学习记录。无需数据库迁移，保留现有数据库绑定及加密服务端密钥。

## 疑难词校正参考

以下是编写过程中用于核对易混词的词典入口；双语例句为本项目编写，没有复制词典例句。并未声称全词库获得外部词典认证。

- [Cambridge：sliver](https://dictionary.cambridge.org/dictionary/english/sliver)：源表把细片误写成了 silver 的银、银器，教学释义与音标已纠正。
- [Collins：tensile](https://www.collinsdictionary.com/dictionary/english/tensile)：区分张力相关和可拉伸的含义。
- [Collins：wretch](https://www.collinsdictionary.com/dictionary/english/wretch)：区分表示怜悯和表示厌恶的文学用法。
- [Merriam-Webster：vomit](https://www.merriam-webster.com/dictionary/vomit)：区分动词、呕吐物以及罕见的催吐剂名词用法。
- [Collins：solicitor](https://www.collinsdictionary.com/us/dictionary/english/solicitor)：事务律师与美国政府法务官分开呈现。
- [Collins：graphic](https://www.collinsdictionary.com/dictionary/english/graphic)：源表“文学的”校正为文字、书写相关。
- [Cambridge：premium](https://dictionary.cambridge.org/us/dictionary/english/premium?topic=insurance)：保险义校正为保险费。
- [Cambridge：professional](https://dictionary.cambridge.org/dictionary/english/professional)：不再把专业人员直接等同于自由职业者。
- [Collins：outcome](https://www.collinsdictionary.com/us/dictionary/english/outcome)：删除混入的出口、输出量释义。
- [Cambridge：discount 发音](https://dictionary.cambridge.org/us/pronunciation/english/discount)：补充分词性重音提示。

- [Merriam-Webster：allergic](https://www.merriam-webster.com/dictionary/allergic)、[geometric](https://www.merriam-webster.com/dictionary/geometric)：纠正源词性误标。
- [Merriam-Webster：foster](https://www.merriam-webster.com/dictionary/foster)、[graduate](https://www.merriam-webster.com/dictionary/graduate)：分别核对寄养与毕业相关的不同词性。
- [Cambridge：internship](https://dictionary.cambridge.org/us/dictionary/english/internship)：实习、实习期不混同于实习医师。
- [Cambridge：paralysis](https://dictionary.cambridge.org/us/dictionary/english/paralysis)：区分瘫痪、麻痹及比喻义，删除混入的中风。
- [Cambridge：subject 发音](https://dictionary.cambridge.org/us/pronunciation/english/subject)：补充分词性读音。

最终内容检查：3680 词（雅思 3,655 + 额外关联词 25）、6826 个义项、13866 条中英例句；缺词和结构错误均为 0。112 项自动测试通过，另通过独立浏览器交互与手机布局检查。
