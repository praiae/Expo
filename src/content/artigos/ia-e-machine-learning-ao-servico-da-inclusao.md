---
titulo: "Inteligência artificial e machine learning ao serviço da inclusão"
subtitulo: "Oportunidades, riscos e um caminho responsável para as pessoas com deficiência em Angola"
resumo: "A inteligência artificial (IA) e a aprendizagem automática (machine learning, ML) estão a transformar as tecnologias de apoio: descrevem o mundo a quem não vê, transcrevem a fala para quem não ouve, antecipam quedas de pessoas idosas e tornam as cadeiras de rodas e as próteses mais inteligentes. Este artigo apresenta as principais aplicações, discute os riscos de enviesamento, privacidade e exclusão digital, e propõe princípios para que a inovação chegue primeiro a quem mais precisa — com especial atenção ao contexto angolano, onde a escassez de dados e de serviços torna ainda mais importante uma abordagem baseada em evidência."
autores:
  - nome: "Edmilson Praia"
data: 2026-10-09
categoria: "Investigação"
palavrasChave:
  - "inteligência artificial"
  - "machine learning"
  - "tecnologias de apoio"
  - "acessibilidade"
  - "pessoas com deficiência"
  - "Angola"
idioma: "pt-PT"
---

## 1. Introdução

Segundo a Organização Mundial da Saúde, cerca de 1,3 mil milhões de pessoas — aproximadamente uma em cada seis — vivem com uma deficiência significativa[^oms2022]. Mais de 2,5 mil milhões de pessoas precisam de pelo menos um produto de apoio, como óculos, aparelhos auditivos, cadeiras de rodas ou próteses, e esse número poderá ultrapassar os 3,5 mil milhões em 2050, por efeito do envelhecimento da população e do aumento das doenças crónicas[^great2022]. O mesmo relatório mostra que, em alguns países de baixo rendimento, apenas 3 % das pessoas que precisam de um produto de apoio têm acesso a ele.

É neste contexto que a inteligência artificial (IA) e, em particular, a aprendizagem automática (*machine learning*, ML) despertam grande expectativa. Pela primeira vez, temos sistemas capazes de reconhecer imagens, compreender a fala, prever acontecimentos e adaptar-se a cada utilizador com uma qualidade que, há uma década, parecia ficção. Mas a tecnologia não é neutra: pode reduzir barreiras ou criar novas, conforme a forma como é concebida, treinada e distribuída.

Este artigo tem três objetivos: (i) descrever as aplicações de IA e ML com maior impacto para as pessoas com deficiência e para as pessoas idosas; (ii) identificar os riscos técnicos, éticos e sociais; e (iii) propor princípios práticos para projetos em Angola, incluindo a própria plataforma Expo Connect Angola.

> **Nota sobre terminologia.** No dia a dia ouve-se muitas vezes a expressão «pessoas especiais». Neste texto usamos «pessoas com deficiência», o termo adotado pela Convenção das Nações Unidas sobre os Direitos das Pessoas com Deficiência[^crpd], porque coloca a pessoa em primeiro lugar e reconhece que a deficiência resulta da interação entre a condição de saúde e as barreiras do meio.

## 2. O que é, afinal, a aprendizagem automática?

Um programa tradicional segue regras escritas por um programador. Um modelo de aprendizagem automática aprende essas regras a partir de exemplos: se lhe mostrarmos milhares de fotografias de passadeiras, aprende a reconhecê-las; se lhe dermos horas de gravações de voz com a respetiva transcrição, aprende a converter fala em texto.

Três famílias de técnicas são particularmente relevantes para a acessibilidade:

- **Visão por computador** — modelos que interpretam imagens e vídeo (deteção de objetos, leitura de texto, reconhecimento de gestos).
- **Processamento de linguagem e de fala** — reconhecimento automático da fala, síntese de voz, tradução e modelos de linguagem capazes de resumir, simplificar ou explicar textos.
- **Modelos preditivos sobre sinais e dados** — classificação de sinais de sensores (acelerómetros, sinais musculares), deteção de anomalias e previsão de riscos.

O ponto essencial é este: **um modelo é tão bom quanto os dados com que foi treinado**. Esta ideia simples atravessa todo o resto do artigo.

## 3. Aplicações com impacto real

### 3.1 Deficiência visual: descrever o mundo

Para pessoas cegas ou com baixa visão — incluindo pessoas com albinismo, que em Angola enfrentam frequentemente limitações visuais significativas — a visão por computador abriu possibilidades novas. Aplicações de telemóvel conseguem ler documentos e rótulos em voz alta, identificar notas de banco, descrever uma cena ou responder a perguntas sobre uma fotografia («qual é a data de validade deste medicamento?»).

A investigação nesta área mostrou também os limites: no conjunto de dados VizWiz, construído com fotografias tiradas por pessoas cegas no seu quotidiano, as imagens são muitas vezes desfocadas, mal enquadradas ou mal iluminadas — muito diferentes das imagens «perfeitas» usadas para treinar a maioria dos modelos[^vizwiz]. Um sistema que funciona bem em laboratório pode falhar precisamente nas situações de uso real. Os óculos inteligentes com câmara e assistente de voz levam estas funções para um formato mãos-livres, mas o preço e a dependência de ligação à internet continuam a ser obstáculos importantes.

### 3.2 Deficiência auditiva: da fala ao texto e à língua gestual

O reconhecimento automático da fala permite legendar conversas, aulas e reuniões em tempo real. Modelos treinados com grandes volumes de áudio multilingue, como o Whisper, tornaram esta capacidade muito mais robusta a ruído e a sotaques[^whisper]. Para pessoas surdas ou com perda auditiva, a legendagem automática no telemóvel pode ser a diferença entre participar ou não numa consulta médica.

A língua gestual é um desafio bem mais difícil. As línguas gestuais — como a Língua Gestual Angolana ou a Língua Gestual Portuguesa — são línguas completas, com gramática própria, e envolvem não só as mãos mas também a expressão facial e o movimento do corpo. A investigação sublinha que o reconhecimento e a tradução automáticos de língua gestual exigem conjuntos de dados muito maiores do que os disponíveis e, sobretudo, a participação da comunidade surda na conceção dos sistemas[^bragg]. Ferramentas criadas sem essa participação arriscam-se a ser tecnicamente impressionantes e socialmente inúteis.

### 3.3 Comunicação aumentativa e alternativa

Pessoas com paralisia cerebral, esclerose lateral amiotrófica ou após um AVC podem ter grande dificuldade em falar ou escrever. Os sistemas de comunicação aumentativa e alternativa (CAA) beneficiam muito da IA: a previsão de palavras e frases reduz o número de seleções necessárias, e a síntese de voz permite hoje criar vozes mais naturais e até personalizadas. Os modelos de linguagem podem também simplificar textos administrativos ou médicos, tornando-os acessíveis a pessoas com deficiência intelectual.

### 3.4 Mobilidade: cadeiras de rodas e próteses inteligentes

As **cadeiras de rodas inteligentes** combinam sensores (câmaras, LiDAR, ultrassons) com algoritmos de navegação para evitar obstáculos, seguir trajetos ou partilhar o controlo com o utilizador — uma ajuda decisiva para quem tem pouca força ou controlo motor[^cadeiras]. Em contextos com passeios irregulares e pouca infraestrutura acessível, funções simples como a deteção de degraus e desníveis têm mais valor do que a condução totalmente autónoma.

Nas **próteses de membro superior**, o reconhecimento de padrões em sinais eletromiográficos (a atividade elétrica dos músculos) permite que o utilizador controle vários movimentos da mão de forma mais intuitiva. A investigação mostra, porém, que a passagem do laboratório para o uso clínico diário exige modelos robustos à fadiga, ao suor e à mudança de posição dos elétrodos[^emg].

Há ainda uma aplicação menos visível mas muito prática: a **manutenção preditiva**. Sensores simples numa cadeira de rodas elétrica podem detetar o desgaste da bateria ou dos motores antes de uma avaria — e uma cadeira avariada significa, muitas vezes, uma pessoa fechada em casa.

### 3.5 Envelhecimento e vida independente

Para pessoas idosas, a deteção automática de quedas a partir de sensores de movimento (relógios, telemóveis ou sensores no domicílio) permite pedir ajuda mesmo quando a pessoa não o consegue fazer. Modelos que aprendem os padrões habituais de atividade podem sinalizar alterações — dormir muito mais, deixar de se levantar — que justificam uma visita. Estas soluções devem ser sempre opcionais, transparentes e respeitadoras da privacidade: o objetivo é apoiar a autonomia, não vigiar.

### 3.6 Dados para decidir melhor

Por fim, a IA pode ajudar quem planeia políticas e serviços. A Convenção das Nações Unidas obriga os Estados a recolher dados estatísticos adequados para formular e aplicar políticas para as pessoas com deficiência (artigo 31.º)[^crpd]. Plataformas de registo como a Expo Connect Angola produzem exatamente esse tipo de informação: quantas pessoas cegas, cadeirantes ou idosas existem em cada município, de que produtos precisam e quem precisa com mais urgência.

Com dados de qualidade, técnicas de ML podem ajudar a estimar a procura futura de produtos de apoio, a identificar zonas com sub-registo ou a otimizar rotas de equipas no terreno. No entanto, para decidir **quem é atendido primeiro**, defendemos uma abordagem cautelosa, que discutimos na secção 5.

## 4. Riscos e limites

### 4.1 Enviesamento e exclusão

Os modelos aprendem com os dados que existem — e as pessoas com deficiência estão sistematicamente sub-representadas nesses dados. Um sistema de reconhecimento de fala pode funcionar mal com vozes afetadas por paralisia cerebral ou por surdez; um sistema de visão pode não reconhecer uma pessoa em cadeira de rodas como «peão»; um algoritmo de seleção de candidatos a emprego pode penalizar padrões de movimento ou de fala atípicos[^ainow][^guo]. Pior: como a deficiência é muito diversa, um modelo pode parecer «justo» em média e falhar gravemente para grupos pequenos.

No contexto angolano acresce outra camada: a maioria dos modelos é treinada sobretudo em inglês e com dados de países de rendimento elevado. Sotaques angolanos, línguas nacionais como o umbundu ou o kimbundu, e as condições reais de iluminação, ruído e conectividade estão mal representados.

### 4.2 Privacidade e dados sensíveis

Informação sobre deficiência e saúde é das mais sensíveis que existem. Em Angola, a Lei n.º 22/11, de 17 de junho (Lei da Proteção de Dados Pessoais), exige uma base legal e cuidados reforçados para o tratamento destes dados; na União Europeia, o Regulamento Geral sobre a Proteção de Dados e, mais recentemente, o Regulamento da Inteligência Artificial (Regulamento (UE) 2024/1689) estabelecem regras específicas para sistemas de IA de risco elevado[^aiact]. Independentemente da jurisdição, o princípio é o mesmo: recolher apenas o necessário, com consentimento informado, e proteger os dados com encriptação e controlo de acessos.

### 4.3 Custo, conectividade e dependência

Muitas soluções de IA dependem de telemóveis recentes, de ligação permanente à internet ou de subscrições pagas. Para a maioria das pessoas com deficiência em países de baixo e médio rendimento, estas condições não estão garantidas. Uma tecnologia que só funciona em Luanda, com 4G, não é uma solução nacional. Modelos que funcionam offline no próprio dispositivo, e serviços de manutenção locais, são tão importantes como a inovação em si.

### 4.4 A «solução» que ninguém pediu

Há uma longa história de tecnologias concebidas *para* pessoas com deficiência sem serem concebidas *com* elas. O lema do movimento das pessoas com deficiência — «nada sobre nós sem nós» — aplica-se integralmente à IA: as pessoas que vão usar a tecnologia devem participar na definição do problema, na recolha de dados e na avaliação.

## 5. Princípios para uma IA inclusiva em Angola

Com base na literatura e na experiência de desenvolvimento da plataforma Expo Connect Angola, propomos sete princípios:

1. **Começar pelo problema, não pela tecnologia.** Uma cadeira de rodas manual bem ajustada e com manutenção garantida vale mais do que uma cadeira «inteligente» que ninguém sabe reparar.
2. **Participação desde o início.** Associações de pessoas com deficiência, famílias e técnicos de reabilitação devem integrar as equipas de projeto.
3. **Dados locais, recolhidos com ética.** Investir em conjuntos de dados angolanos — vozes, imagens, língua gestual — com consentimento informado e benefício partilhado para as comunidades.
4. **Transparência nas decisões que afetam pessoas.** Quando um sistema decide quem é atendido primeiro, as regras devem ser compreensíveis e auditáveis. Na Expo Connect Angola, a prioridade é calculada por uma pontuação explícita — com fatores como necessitar de apoio permanente ou não conseguir sair de casa sem ajuda — e cada registo mostra os motivos da sua classificação. Modelos de ML podem complementar esta lógica (por exemplo, para detetar registos inconsistentes), mas não devem substituí-la por uma «caixa negra».
5. **Avaliar por subgrupos.** Medir o desempenho separadamente para pessoas cegas, surdas, cadeirantes, idosas, por sexo e por província, e não apenas em média.
6. **Privacidade por defeito.** Encriptação dos dados sensíveis, perfis de acesso, registo de auditoria e estatísticas apenas agregadas ou anonimizadas.
7. **Pensar na sustentabilidade.** Preferir soluções que funcionam offline, em equipamentos acessíveis, e prever formação e manutenção locais.

## 6. Conclusão

A inteligência artificial e a aprendizagem automática oferecem às pessoas com deficiência e às pessoas idosas ferramentas que aumentam de forma real a autonomia: ler, comunicar, deslocar-se, pedir ajuda. Mas os mesmos sistemas podem reproduzir exclusões antigas se forem treinados com dados que não incluem estas pessoas, se forem caros ou se dependerem de infraestruturas que não existem.

Em Angola, o primeiro passo não é comprar algoritmos: é **conhecer**. Saber quantas pessoas precisam de apoio, onde estão, de que precisam e com que urgência. É sobre essa base de dados fiáveis, recolhidos com respeito e proteção, que a inovação pode depois construir soluções que chegam primeiro a quem mais precisa.

[^oms2022]: World Health Organization. (2022). *Global report on health equity for persons with disabilities*. Genebra: World Health Organization.

[^great2022]: World Health Organization & UNICEF. (2022). *Global report on assistive technology*. Genebra: World Health Organization e United Nations Children's Fund.

[^crpd]: Nações Unidas. (2006). *Convenção sobre os Direitos das Pessoas com Deficiência*. Nova Iorque: Organização das Nações Unidas.

[^vizwiz]: Gurari, D., Li, Q., Stangl, A. J., Guo, A., Lin, C., Grauman, K., Luo, J., & Bigham, J. P. (2018). VizWiz Grand Challenge: Answering visual questions from blind people. *Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition (CVPR)*, 3608–3617.

[^whisper]: Radford, A., Kim, J. W., Xu, T., Brockman, G., McLeavey, C., & Sutskever, I. (2023). Robust speech recognition via large-scale weak supervision. *Proceedings of the 40th International Conference on Machine Learning (ICML)*.

[^bragg]: Bragg, D., Koller, O., Bellard, M., Berke, L., Boudreault, P., Braffort, A., Caselli, N., Huenerfauth, M., Kacorri, H., Verhoef, T., Vogler, C., & Ringel Morris, M. (2019). Sign language recognition, generation, and translation: An interdisciplinary perspective. *Proceedings of the 21st International ACM SIGACCESS Conference on Computers and Accessibility (ASSETS)*, 16–31.

[^cadeiras]: Leaman, J., & La, H. M. (2017). A comprehensive review of smart wheelchairs: Past, present, and future. *IEEE Transactions on Human-Machine Systems, 47*(4), 486–499.

[^emg]: Scheme, E., & Englehart, K. (2011). Electromyogram pattern recognition for control of powered upper-limb prostheses: State of the art and challenges for clinical use. *Journal of Rehabilitation Research and Development, 48*(6), 643–659.

[^ainow]: Whittaker, M., Alper, M., Bennett, C. L., Hendren, S., Kaziunas, L., Mills, M., Ringel Morris, M., Rankin, J., Rogers, E., Salas, M., & West, S. M. (2019). *Disability, bias, and AI*. Nova Iorque: AI Now Institute.

[^guo]: Guo, A., Kamar, E., Vaughan, J. W., Wallach, H., & Morris, M. R. (2020). Toward fairness in AI for people with disabilities: A research roadmap. *ACM SIGACCESS Accessibility and Computing, 125*.

[^aiact]: União Europeia. (2024). Regulamento (UE) 2024/1689 do Parlamento Europeu e do Conselho, de 13 de junho de 2024, que cria regras harmonizadas em matéria de inteligência artificial. *Jornal Oficial da União Europeia*.
