import re
import json
from datetime import datetime

# Contenido scrapeado de https://reflejosdelaciudad.com.ar/edicionesanteriores/
CONTENT = r"""
[![](../2026031745.jpg)](https://reflejosdelaciudad.com.ar/17452026.pdf)  

13 de marzo 2026

[![](../2026031744.jpg)](https://reflejosdelaciudad.com.ar/17442026.pdf)  

6 de marzo 2026

[![](../2026021743.jpg)](https://reflejosdelaciudad.com.ar/17432026.pdf)  

27 de febrero 2026

[![](../2026021742.jpg)](https://reflejosdelaciudad.com.ar/17422026.pdf)  

20 de febrero 2026

[![](../2026021741.jpg)](https://reflejosdelaciudad.com.ar/17412026.pdf)  

13 de febrero 2026

[![](../2026021740.jpg)](https://reflejosdelaciudad.com.ar/17402026.pdf)  

6 de febrero 2026

[![](../2026011739.jpg)](https://reflejosdelaciudad.com.ar/17392026.pdf)  

30 de enero 2026

[![](../2026011738.jpg)](https://reflejosdelaciudad.com.ar/17382026.pdf)  

9 de enero 2026

[![](../2025121737.jpg)](https://reflejosdelaciudad.com.ar/17372025.pdf)  

26 de diciembre 2025

[![](../2025121736.jpg)](https://reflejosdelaciudad.com.ar/17362025.pdf)  

19 de diciembre 2025

[![](../2025121735.jpg)](https://reflejosdelaciudad.com.ar/17352025.pdf)  

12 de diciembre 2025

[![](../2025121734.jpg)](https://reflejosdelaciudad.com.ar/17342025.pdf)  

5 de diciembre 2025

[![](../2025111733.jpg)](https://reflejosdelaciudad.com.ar/17332025.pdf)  

27 de noviembre 2025

[![](../2025111732.jpg)](https://reflejosdelaciudad.com.ar/17322025.pdf)  

21 de noviembre 2025

[![](../2025111731.jpg)](https://reflejosdelaciudad.com.ar/17312025.pdf)  

14 de noviembre 2025

[![](../2025111730.jpg)](https://reflejosdelaciudad.com.ar/17302025.pdf)  

7 de noviembre 2025

[![](../2025101729.jpg)](https://reflejosdelaciudad.com.ar/17292025.pdf)  

31 de octubre 2025

[![](../2025101728.jpg)](https://reflejosdelaciudad.com.ar/17282025.pdf)  

17 de octubre 2025

[![](../2025101727.jpg)](https://reflejosdelaciudad.com.ar/17272025.pdf)  

10 de octubre 2025

[![](../2025101726.jpg)](https://reflejosdelaciudad.com.ar/17262025.pdf)  

3 de octubre 2025

[![](../2025091725.jpg)](https://reflejosdelaciudad.com.ar/17252025.pdf)  

26 de septiembre 2025

[![](../2025091724.jpg)](https://reflejosdelaciudad.com.ar/17242025.pdf)  

19 de septiembre 2025

[![](../2025091723.jpg)](https://reflejosdelaciudad.com.ar/17232025.pdf)  

12 de septiembre 2025

[![](../2025091721.jpg)](https://reflejosdelaciudad.com.ar/17212025.pdf)  

5 de septiembre 2025

[![](../2025081720.jpg)](https://reflejosdelaciudad.com.ar/17202025.pdf)  

15 de agosto 2025

[![](../2025081719.jpg)](https://reflejosdelaciudad.com.ar/17192025.pdf)  

8 de agosto 2025

[![](../2025081718.jpg)](https://reflejosdelaciudad.com.ar/17182025.pdf)  

1 de agosto 2025

[![](../2025071717.jpg)](https://reflejosdelaciudad.com.ar/17172025.pdf)  

25 de julio 2025

[![](../2025071716.jpg)](https://reflejosdelaciudad.com.ar/17162025.pdf)  

18 de julio 2025

[![](../2025071715.jpg)](https://reflejosdelaciudad.com.ar/17152025.pdf)  

11 de julio 2025

[![](../2025071714.jpg)](https://reflejosdelaciudad.com.ar/17142025.pdf)  

4 de julio 2025

[![](../2025061713.jpg)](https://reflejosdelaciudad.com.ar/17132025.pdf)  

27 de junio 2025

[![](../2025061712.jpg)](https://reflejosdelaciudad.com.ar/17122025.pdf)  

20 de junio 2025

[![](../2025061711.jpg)](https://reflejosdelaciudad.com.ar/17112025.pdf)  

13 de junio 2025

[![](../2025061710.jpg)](https://reflejosdelaciudad.com.ar/17102025.pdf)  

6 de junio 2025

[![](../2025051709.jpg)](https://reflejosdelaciudad.com.ar/17092025.pdf)  

23 de mayo 2025

[![](../2025051708.jpg)](https://reflejosdelaciudad.com.ar/17082025.pdf)  

16 de mayo 2025

[![](../2025051707.jpg)](https://reflejosdelaciudad.com.ar/17072025.pdf)  

9 de mayo 2025

[![](../2025051706.jpg)](https://reflejosdelaciudad.com.ar/17062025.pdf)  

2 de mayo 2025

[![](../2025041705.jpg)](https://reflejosdelaciudad.com.ar/17052025.pdf)  

25 de abril 2025

[![](../2025041704.jpg)](https://reflejosdelaciudad.com.ar/17042025.pdf)  

18 de abril 2025

[![](../2025041703.jpg)](https://reflejosdelaciudad.com.ar/17032025.pdf)  

11 de abril 2025

[![](../2025041702.jpg)](https://reflejosdelaciudad.com.ar/17022025.pdf)  

4 de abril 2025

[![](../2025031701.jpg)](https://reflejosdelaciudad.com.ar/17012025.pdf)  

28 de marzo 2025

[![](../2025031700.jpg)](https://reflejosdelaciudad.com.ar/17002025.pdf)  

21 de marzo 2025

[![](../2025031699.jpg)](https://reflejosdelaciudad.com.ar/16992025.pdf)  

14 de marzo 2025

[![](../2025031698.jpg)](https://reflejosdelaciudad.com.ar/16982025.pdf)  

7 de marzo 2025

[![](../2025021697.jpg)](https://reflejosdelaciudad.com.ar/16972025.pdf)  

28 de febrero 2025

[![](../2025021696.jpg)](https://reflejosdelaciudad.com.ar/16962025.pdf)  

21 de febrero 2025

[![](../2025021695.jpg)](https://reflejosdelaciudad.com.ar/16952025.pdf)  

14 de febrero 2025

[![](../2025021694.jpg)](https://reflejosdelaciudad.com.ar/16942025.pdf)  

7 de febrero 2025

[![](../2025011693.jpg)](https://reflejosdelaciudad.com.ar/16932025.pdf)  

31 de enero 2025

[![](../2025011692.jpg)](https://reflejosdelaciudad.com.ar/16922025.pdf)  

24 de enero 2025

[![](../2025011691.jpg)](https://reflejosdelaciudad.com.ar/16912025.pdf)  

3 de enero 2025

[![](../2024121690.jpg)](https://reflejosdelaciudad.com.ar/16902024.pdf)  

27 de diciembre 2024

[![](../2024121689-2.jpg)](https://reflejosdelaciudad.com.ar/1689-2-2024.pdf)  

20 de diciembre 2024

[![](../2024121689.jpg)](https://reflejosdelaciudad.com.ar/16892024.pdf)  

13 de diciembre 2024

[![](../2024111688.jpg)](https://reflejosdelaciudad.com.ar/16882024.pdf)  

22 de noviembre 2024

[![](../2024111687.jpg)](https://reflejosdelaciudad.com.ar/16872024.pdf)  

15 de noviembre 2024

[![](../2024111686.jpg)](https://reflejosdelaciudad.com.ar/16862024.pdf)  

8 de noviembre 2024

[![](../2024111685.jpg)](https://reflejosdelaciudad.com.ar/16852024.pdf)  

1 de noviembre 2024

[![](../2024101684.jpg)](https://reflejosdelaciudad.com.ar/16842024.pdf)  

25 de octubre 2024

[![](../2024101683.jpg)](https://reflejosdelaciudad.com.ar/16832024.pdf)  

18 de octubre 2024

[![](../2024101682.jpg)](https://reflejosdelaciudad.com.ar/16822024.pdf)  

11 de octubre 2024

[![](../2024101681.jpg)](https://reflejosdelaciudad.com.ar/16812024.pdf)  

4 de octubre 2024

[![](../2024091680.jpg)](https://reflejosdelaciudad.com.ar/16802024.pdf)  

27 de septiembre 2024

[![](../2024091679.jpg)](https://reflejosdelaciudad.com.ar/16792024.pdf)  

20 de septiembre 2024

[![](../2024091678.jpg)](https://reflejosdelaciudad.com.ar/16782024.pdf)  

13 de septiembre 2024

[![](../2024091677.jpg)](https://reflejosdelaciudad.com.ar/16772024.pdf)  

6 de septiembre 2024

[![](../2024081676.jpg)](https://reflejosdelaciudad.com.ar/16762024.pdf)  

30 de agosto 2024

[![](../2024081675.jpg)](https://reflejosdelaciudad.com.ar/16752024.pdf)  

23 de agosto 2024

[![](../2024081674.jpg)](https://reflejosdelaciudad.com.ar/16742024.pdf)  

9 de agosto 2024

[![](../2024081673.jpg)](https://reflejosdelaciudad.com.ar/16732024.pdf)  

2 de agosto 2024

[![](../2024071672.jpg)](https://reflejosdelaciudad.com.ar/16722024.pdf)  

26 de julio 2024

[![](../2024071671.jpg)](https://reflejosdelaciudad.com.ar/16712024.pdf)  

19 de julio 2024

[![](../2024071670.jpg)](https://reflejosdelaciudad.com.ar/16702024.pdf)  

12 de julio 2024

[![](../2024071669.jpg)](https://reflejosdelaciudad.com.ar/16692024.pdf)  

5 de julio 2024

[![](../2024061668.jpg)](https://reflejosdelaciudad.com.ar/16682024.pdf)  

28 de junio 2024

[![](../2024061667.jpg)](https://reflejosdelaciudad.com.ar/16672024.pdf)  

21 de junio 2024

[![](../2024061666.jpg)](https://reflejosdelaciudad.com.ar/16662024.pdf)  

14 de junio 2024

[![](../2024061665.jpg)](https://reflejosdelaciudad.com.ar/16652024.pdf)  

7 de junio 2024

[![](../2024051664.jpg)](https://reflejosdelaciudad.com.ar/16642024.pdf)  

31 de mayo 2024

[![](../2024051663.jpg)](https://reflejosdelaciudad.com.ar/16632024.pdf)  

24 de mayo 2024

[![](../2024051662.jpg)](https://reflejosdelaciudad.com.ar/16622024.pdf)  

17 de mayo 2024

[![](../2024051661.jpg)](https://reflejosdelaciudad.com.ar/16612024.pdf)  

3 de mayo 2024

[![](../2024041660.jpg)](https://reflejosdelaciudad.com.ar/16602024.pdf)  

26 de abril 2024

[![](../2024041659.jpg)](https://reflejosdelaciudad.com.ar/16592024.pdf)  

19 de abril 2024

[![](../2024041658.jpg)](https://reflejosdelaciudad.com.ar/16582024.pdf)  

12 de abril 2024

[![](../2024041657.jpg)](https://reflejosdelaciudad.com.ar/16572024.pdf)  

5 de abril 2024

[![](../2024031656.jpg)](https://reflejosdelaciudad.com.ar/16562024.pdf)  

22 de marzo 2024

[![](../2024031655.jpg)](https://reflejosdelaciudad.com.ar/16552024.pdf)  

15 de marzo 2024

[![](../2024031654.jpg)](https://reflejosdelaciudad.com.ar/16542024.pdf)  

8 de marzo 2024

[![](../2024031653.jpg)](https://reflejosdelaciudad.com.ar/16532024.pdf)  

1 de marzo 2024

[![](../2024021652.jpg)](https://reflejosdelaciudad.com.ar/16522024.pdf)  

23 de febrero 2024

[![](../2024021651.jpg)](https://reflejosdelaciudad.com.ar/16512024.pdf)  

16 de febrero 2024

[![](../2024021650.jpg)](https://reflejosdelaciudad.com.ar/16502024.pdf)  

9 de febrero 2024

[![](../2024021649.jpg)](https://reflejosdelaciudad.com.ar/16492024.pdf)  

2 de febrero 2024

[![](../2024011648.jpg)](https://reflejosdelaciudad.com.ar/16482024.pdf)  

26 de enero 2024

[![](../2024011647.jpg)](https://reflejosdelaciudad.com.ar/16472024.pdf)  

05 de enero 2024

[![](../2023121646.jpg)](https://reflejosdelaciudad.com.ar/16462023.pdf)  

22 de diciembre 2023

[![](../2023121645.jpg)](https://reflejosdelaciudad.com.ar/16452023.pdf)  

15 de diciembre 2023

[![](../2023121644.jpg)](https://reflejosdelaciudad.com.ar/16442023.pdf)  

8 de diciembre 2023

[![](../2023121643.jpg)](https://reflejosdelaciudad.com.ar/16432023.pdf)  

1 de diciembre 2023

[![](../2023111642.jpg)](https://reflejosdelaciudad.com.ar/16422023.pdf)  

24 de noviembre 2023

[![](../2023111641.jpg)](https://reflejosdelaciudad.com.ar/16412023.pdf)  

17 de noviembre 2023

[![](../2023111640.jpg)](https://reflejosdelaciudad.com.ar/16402023.pdf)  

10 de noviembre 2023

[![](../2023111639.jpg)](https://reflejosdelaciudad.com.ar/16392023.pdf)  

3 de noviembre 2023

[![](../2023101638.jpg)](https://reflejosdelaciudad.com.ar/16382023.pdf)  

27 de octubre 2023

[![](../2023101637.jpg)](https://reflejosdelaciudad.com.ar/16372023.pdf)  

19 de octubre 2023

[![](../2023101636.jpg)](https://reflejosdelaciudad.com.ar/16362023.pdf)  

13 de octubre 2023

[![](../2023101635.jpg)](https://reflejosdelaciudad.com.ar/16352023.pdf)  

6 de octubre 2023

[![](../2023091634.jpg)](https://reflejosdelaciudad.com.ar/16342023.pdf)  

22 de septiembre 2023

[![](../2023091633.jpg)](https://reflejosdelaciudad.com.ar/16332023.pdf)  

15 de septiembre 2023

[![](../2023091632.jpg)](https://reflejosdelaciudad.com.ar/16322023.pdf)  

8 de septiembre 2023

[![](../2023091631.jpg)](https://reflejosdelaciudad.com.ar/16312023.pdf)  

1 de septiembre 2023

[![](../2023081630.jpg)](https://reflejosdelaciudad.com.ar/16302023.pdf)  

25 de agosto 2023

[![](../2023081629.jpg)](https://reflejosdelaciudad.com.ar/16292023.pdf)  

18 de agosto 2023

[![](../2023081628.jpg)](https://reflejosdelaciudad.com.ar/16282023.pdf)  

11 de agosto 2023

[![](../2023081627.jpg)](https://reflejosdelaciudad.com.ar/16272023.pdf)  

4 de agosto 2023

[![](../2023071626.jpg)](https://reflejosdelaciudad.com.ar/16262023.pdf)  

28 de julio 2023

[![](../2023071625.jpg)](https://reflejosdelaciudad.com.ar/16252023.pdf)  

21 de julio 2023

[![](../2023071624.jpg)](https://reflejosdelaciudad.com.ar/16242023.pdf)  

14 de julio 2023

[![](../2023071623.jpg)](https://reflejosdelaciudad.com.ar/16232023.pdf)  

7 de julio 2023

[![](../2023061622.jpg)](https://reflejosdelaciudad.com.ar/16222023.pdf)  

23 de junio 2023

[![](../2023061621.jpg)](https://reflejosdelaciudad.com.ar/16212023.pdf)  

16 de junio 2023

[![](../2023061620.jpg)](https://reflejosdelaciudad.com.ar/16202023.pdf)  

9 de junio 2023

[![](../2023061619.jpg)](https://reflejosdelaciudad.com.ar/16192023.pdf)  

2 de junio 2023

[![](../2023051618.jpg)](https://reflejosdelaciudad.com.ar/16182023.pdf)  

26 de mayo 2023

[![](../2023051617.jpg)](https://reflejosdelaciudad.com.ar/16172023.pdf)  

19 de mayo 2023

[![](../2023051616.jpg)](https://reflejosdelaciudad.com.ar/16162023.pdf)  

12 de mayo 2023

[![](../2023051615.jpg)](https://reflejosdelaciudad.com.ar/16152023.pdf)  

5 de mayo 2023

[![](../2023041614.jpg)](https://reflejosdelaciudad.com.ar/16142023.pdf)  

28 de abril 2023

[![](../2023041613.jpg)](https://reflejosdelaciudad.com.ar/16132023.pdf)  

21 de abril 2023

[![](../2023041612.jpg)](https://reflejosdelaciudad.com.ar/16122023.pdf)  

14 de abril 2023

[![](../2023041611.jpg)](https://reflejosdelaciudad.com.ar/16112023.pdf)  

7 de abril 2023

[![](../2023031610.jpg)](https://reflejosdelaciudad.com.ar/16102023.pdf)  

24 de marzo 2023

[![](../2023031609.jpg)](https://reflejosdelaciudad.com.ar/16092023.pdf)  

17 de marzo 2023

[![](../2023031608.jpg)](https://reflejosdelaciudad.com.ar/16082023-con-suplemento-mujer.pdf)  

10 de marzo 2023 + Suplemento Mujer

[![](../2023031607.jpg)](https://reflejosdelaciudad.com.ar/16072023.pdf)  

3 de marzo 2023

[![](../2023021606.jpg)](https://reflejosdelaciudad.com.ar/16062023.pdf)  

24 de febrero 2023

[![](../2023021605.jpg)](https://reflejosdelaciudad.com.ar/16052023.pdf)  

17 de febrero 2023

[![](../2023021604.jpg)](https://reflejosdelaciudad.com.ar/16042023.pdf)  

10 de febrero 2023

[![](../2023021603.jpg)](https://reflejosdelaciudad.com.ar/16032023.pdf)  

3 de febrero 2023

[![](../2023011602.jpg)](https://reflejosdelaciudad.com.ar/16022023.pdf)  

27 de enero 2023

[![](../2023011601.jpg)](https://reflejosdelaciudad.com.ar/16012023.pdf)  

6 de enero 2023

[![](../2022121600.jpg)](https://reflejosdelaciudad.com.ar/16002022.pdf)  

23 de diciembre 2022

[![](../2022121599.jpg)](https://reflejosdelaciudad.com.ar/15992022.pdf)  

16 de diciembre 2022

[![](../2022121598.jpg)](https://reflejosdelaciudad.com.ar/15982022.pdf)  

9 de diciembre 2022

[![](../2022121597.jpg)](https://reflejosdelaciudad.com.ar/15972022.pdf)  

2 de diciembre 2022

[![](../2022111596.jpg)](https://reflejosdelaciudad.com.ar/15962022.pdf)  

25 de noviembre 2022

[![](../2022111595.jpg)](https://reflejosdelaciudad.com.ar/15952022.pdf)  

18 de noviembre 2022

[![](../2022111594.jpg)](https://reflejosdelaciudad.com.ar/15942022.pdf)  

11 de noviembre 2022

[![](../2022111593.jpg)](https://reflejosdelaciudad.com.ar/15932022.pdf)  

4 de noviembre 2022

[![](../2022101592.jpg)](https://reflejosdelaciudad.com.ar/15922022.pdf)  

28 de octubre 2022

[![](../2022101591.jpg)](https://reflejosdelaciudad.com.ar/15912022.pdf)  

21 de octubre 2022

[![](../2022101590.jpg)](https://reflejosdelaciudad.com.ar/15902022.pdf)  

14 de octubre 2022

[![](../2022101589.jpg)](https://reflejosdelaciudad.com.ar/15892022.pdf)  

7 de octubre 2022

[![](../2022091588.jpg)](https://reflejosdelaciudad.com.ar/15882022.pdf)  

23 de septiembre 2022

[![](../2022091587.jpg)](https://reflejosdelaciudad.com.ar/15872022.pdf)  

16 de septiembre 2022

[![](../2022091586.jpg)](https://reflejosdelaciudad.com.ar/15862022.pdf)  

9 de septiembre 2022

[![](../2022091585.jpg)](https://reflejosdelaciudad.com.ar/15852022.pdf)  

2 de septiembre 2022

[![](../2022081584.jpg)](https://reflejosdelaciudad.com.ar/15842022.pdf)  

26 de agosto 2022

[![](../2022081583.jpg)](https://reflejosdelaciudad.com.ar/15832022.pdf)  

19 de agosto 2022

[![](../2022081582.jpg)](https://reflejosdelaciudad.com.ar/15822022.pdf)  

12 de agosto 2022

[![](../2022081581.jpg)](https://reflejosdelaciudad.com.ar/15812022.pdf)  

5 de agosto 2022

[![](../2022071580.jpg)](https://reflejosdelaciudad.com.ar/15802022.pdf)  

29 de julio 2022

[![](../2022071579.jpg)](https://reflejosdelaciudad.com.ar/15792022.pdf)  

15 de julio 2022

[![](../2022071578.jpg)](https://reflejosdelaciudad.com.ar/15782022.pdf)  

8 de julio 2022

[![](../2022071577.jpg)](https://reflejosdelaciudad.com.ar/15772022.pdf)  

1 de julio 2022

[![](../2022061576.jpg)](https://reflejosdelaciudad.com.ar/15762022.pdf)  

24 de junio 2022

[![](../2022061575.jpg)](https://reflejosdelaciudad.com.ar/15752022.pdf)  

17 de junio 2022

[![](../2022061574.jpg)](https://reflejosdelaciudad.com.ar/15742022.pdf)  

10 de junio 2022

[![](../2022061573.jpg)](https://reflejosdelaciudad.com.ar/15732022.pdf)  

3 de junio 2022

[![](../2022051572.jpg)](https://reflejosdelaciudad.com.ar/15722022.pdf)  

27 de mayo 2022

[![](../2022051571.jpg)](https://reflejosdelaciudad.com.ar/15712022.pdf)  

20 de mayo 2022

[![](../2022051570.jpg)](https://reflejosdelaciudad.com.ar/15702022.pdf)  

13 de mayo 2022

[![](../2022051569.jpg)](https://reflejosdelaciudad.com.ar/15692022.pdf)  

6 de mayo 2022

[![](../2022041568.jpg)](https://reflejosdelaciudad.com.ar/15682022.pdf)  

29 de abril 2022

[![](../2022041567.jpg)](https://reflejosdelaciudad.com.ar/15672022.pdf)  

22 de abril 2022

[![](../2022041566.jpg)](https://reflejosdelaciudad.com.ar/15662022.pdf)  

8 de abril 2022

[![](../2022041565.jpg)](https://reflejosdelaciudad.com.ar/15652022.pdf)  

1 de abril 2022

[![](../2022031564.jpg)](https://reflejosdelaciudad.com.ar/15642022.pdf)  

25 de marzo 2022

[![](../2022031563.jpg)](https://reflejosdelaciudad.com.ar/15632022.pdf)  

18 de marzo 2022

[![](../2022031562.jpg)](https://reflejosdelaciudad.com.ar/15622022-suplemento-mujer.pdf)  

11 de marzo 2022

[![](../2022031561.jpg)](https://reflejosdelaciudad.com.ar/15612022.pdf)  

4 de marzo 2022

[![](../2022021560.jpg)](https://reflejosdelaciudad.com.ar/15602022.pdf)  

25 de febrero 2022

[![](../2022021559.jpg)](https://reflejosdelaciudad.com.ar/15592022.pdf)  

18 de febrero 2022

[![](../2022021558.jpg)](https://reflejosdelaciudad.com.ar/15582022.pdf)  

11 de febrero 2022

[![](../2022021557.jpg)](https://reflejosdelaciudad.com.ar/15572022.pdf)  

4 de febrero 2022

[![](../2022011556.jpg)](https://reflejosdelaciudad.com.ar/15562022.pdf)  

28 de enero 2022

[![](../2022011555.jpg)](https://reflejosdelaciudad.com.ar/15552022.pdf)  

7 de enero 2022

[![](../2021121554.jpg)](https://reflejosdelaciudad.com.ar/15542021.pdf)  

24 de diciembre 2021

[![](../2021121553.jpg)](https://reflejosdelaciudad.com.ar/15532021.pdf)  

17 de diciembre 2021

[![](../2021121552.jpg)](https://reflejosdelaciudad.com.ar/15522021.pdf)  

10 de diciembre 2021

[![](../2021121551.jpg)](https://reflejosdelaciudad.com.ar/15512021.pdf)  

3 de diciembre 2021

[![](../2021111550.jpg)](https://reflejosdelaciudad.com.ar/15502021.pdf)  

26 de noviembre 2021

[![](../2021111549.jpg)](https://reflejosdelaciudad.com.ar/15492021.pdf)  

19 de noviembre 2021

[![](../2021111548.jpg)](https://reflejosdelaciudad.com.ar/15482021.pdf)  

12 de noviembre 2021

[![](../2021111547.jpg)](https://reflejosdelaciudad.com.ar/15472021.pdf)  

5 de noviembre 2021

[![](../2021101546.jpg)](https://reflejosdelaciudad.com.ar/15462021.pdf)  

29 de octubre 2021

[![](../2021101545-suplemento.jpg)](https://reflejosdelaciudad.com.ar/15452021-suplemento.pdf)  

SUPLEMENTO 22 de octubre 2021

[![](../2021101545.jpg)](https://reflejosdelaciudad.com.ar/15452021.pdf)  

22 de octubre 2021

[![](../2021101544.jpg)](https://reflejosdelaciudad.com.ar/15442021.pdf)  

15 de octubre 2021

[![](../2021101543.jpg)](https://reflejosdelaciudad.com.ar/15432021.pdf)  

8 de octubre 2021

[![](../2021101542.jpg)](https://reflejosdelaciudad.com.ar/15422021.pdf)  

1 de octubre 2021

[![](../2021091541.jpg)](https://reflejosdelaciudad.com.ar/15412021.pdf)  

24 de septiembre 2021

[![](../2021091540.jpg)](https://reflejosdelaciudad.com.ar/15402021.pdf)  

17 de septiembre 2021

[![](../2021091539.jpg)](https://reflejosdelaciudad.com.ar/15392021.pdf)  

10 de septiembre 2021

[![](../2021091538.jpg)](https://reflejosdelaciudad.com.ar/15382021.pdf)  

3 de septiembre 2021

[![](../2021081537.jpg)](https://reflejosdelaciudad.com.ar/15372021.pdf)  

27 de agosto 2021

[![](../2021081536.jpg)](https://reflejosdelaciudad.com.ar/15362021.pdf)  

20 de agosto 2021

[![](../2021081535.jpg)](https://reflejosdelaciudad.com.ar/15352021.pdf)  

13 de agosto 2021

[![](../2021081534.jpg)](https://reflejosdelaciudad.com.ar/15342021.pdf)  

6 de agosto 2021

[![](../2021071533.jpg)](https://reflejosdelaciudad.com.ar/15332021.pdf)  

30 de julio 2021

[![](../2021071532.jpg)](https://reflejosdelaciudad.com.ar/15322021.pdf)  

23 de julio 2021

[![](../2021071531.jpg)](https://reflejosdelaciudad.com.ar/15312021.pdf)  

16 de julio 2021

[![](../2021071530.jpg)](https://reflejosdelaciudad.com.ar/15302021.pdf)  

9 de julio 2021

[![](../2021071529.jpg)](https://reflejosdelaciudad.com.ar/15292021.pdf)  

2 de julio 2021

[![](../2021061528.jpg)](https://reflejosdelaciudad.com.ar/15282021.pdf)  

25 de junio 2021

[![](../2021061527.jpg)](https://reflejosdelaciudad.com.ar/15272021.pdf)  

18 de junio 2021

[![](../2021061526.jpg)](https://reflejosdelaciudad.com.ar/15262021.pdf)  

11 de junio 2021

[![](../2021061525.jpg)](https://reflejosdelaciudad.com.ar/15252021.pdf)  

4 de junio 2021

[![](../2021051524.jpg)](https://reflejosdelaciudad.com.ar/15242021.pdf)  

28 de mayo 2021

[![](../2021051523.jpg)](https://reflejosdelaciudad.com.ar/15232021.pdf)  

21 de mayo 2021

[![](../2021051522.jpg)](https://reflejosdelaciudad.com.ar/15222021.pdf)  

14 de mayo 2021

[![](../2021051521.jpg)](https://reflejosdelaciudad.com.ar/15212021.pdf)  

7 de mayo 2021

[![](../2021041520.jpg)](https://reflejosdelaciudad.com.ar/15202021.pdf)  

30 de abril 2021

[![](../2021041519.jpg)](https://reflejosdelaciudad.com.ar/15192021.pdf)  

23 de abril 2021

[![](../2021041518.jpg)](https://reflejosdelaciudad.com.ar/15182021.pdf)  

16 de abril 2021

[![](../2021041517.jpg)](https://reflejosdelaciudad.com.ar/15172021.pdf)  

9 de abril 2021

[![](../2021041516.jpg)](https://reflejosdelaciudad.com.ar/15162021.pdf)  

2 de abril 2021

[![](../2021031515.jpg)](https://reflejosdelaciudad.com.ar/15152021.pdf)  

26 de marzo 2021

[![](../2021031514.jpg)](https://reflejosdelaciudad.com.ar/15142021.pdf)  

19 de marzo 2021

[![](../2021031513.jpg)](https://reflejosdelaciudad.com.ar/15132021-suplemento-mujer.pdf)  

12 de marzo 2021

[![](../2021031512.jpg)](https://reflejosdelaciudad.com.ar/15122021.pdf)  

5 de marzo 2021

[![](../2021021511.jpg)](https://reflejosdelaciudad.com.ar/15112021.pdf)  

26 de febrero 2021

[![](../2021021510.jpg)](https://reflejosdelaciudad.com.ar/15102021.pdf)  

19 de febrero 2021

[![](../2021021509.jpg)](https://reflejosdelaciudad.com.ar/15092021.pdf)  

12 de febrero 2021

[![](../2021021508.jpg)](https://reflejosdelaciudad.com.ar/15082021.pdf)  

5 de febrero 2021

[![](../2021011507.jpg)](https://reflejosdelaciudad.com.ar/15072021.pdf)  

29 de enero 2021

[![](../2021011506.jpg)](https://reflejosdelaciudad.com.ar/15062021.pdf)  

22 de enero 2021

[![](../2021011505.jpg)](https://reflejosdelaciudad.com.ar/15052021.pdf)  

15 de enero 2021

[![](../2021011504.jpg)](https://reflejosdelaciudad.com.ar/15042021.pdf)  

8 de enero 2021

[![](../2020121503.jpg)](https://reflejosdelaciudad.com.ar/15032020.pdf)  

25 de diciembre 2020

[![](../2020121502.jpg)](https://reflejosdelaciudad.com.ar/15022020.pdf)  

18 de diciembre 2020

[![](../2020121501.jpg)](https://reflejosdelaciudad.com.ar/15012020.pdf)  

11 de diciembre 2020

[![](../2020121500.jpg)](https://reflejosdelaciudad.com.ar/15002020.pdf)  

4 de diciembre 2020

[![](../2020111499.jpg)](https://reflejosdelaciudad.com.ar/14992020.pdf)  

27 de noviembre 2020

[![](../2020111498.jpg)](https://reflejosdelaciudad.com.ar/14982020.pdf)  

20 de noviembre 2020

[![](../2020111497.jpg)](https://reflejosdelaciudad.com.ar/14972020.pdf)  

13 de noviembre 2020

[![](../2020111496.jpg)](https://reflejosdelaciudad.com.ar/14962020.pdf)  

6 de noviembre 2020

[![](../2020101495.jpg)](https://reflejosdelaciudad.com.ar/14952020.pdf)  

30 de octubre 2020

[![](../2020101494-suplemento.jpg)](https://reflejosdelaciudad.com.ar/14942020-suplemento-pliego.pdf)  

23 de octubre 2020 SUPLEMENTO

[![](../2020101494.jpg)](https://reflejosdelaciudad.com.ar/14942020.pdf)  

23 de octubre 2020

[![](../2020101493.jpg)](https://reflejosdelaciudad.com.ar/14932020.pdf)  

16 de octubre 2020

[![](../2020101492.jpg)](https://reflejosdelaciudad.com.ar/14922020.pdf)  

9 de octubre 2020

[![](../2020101491.jpg)](https://reflejosdelaciudad.com.ar/14912020.pdf)  

2 de octubre 2020

[![](../2020091490.jpg)](https://reflejosdelaciudad.com.ar/14902020.pdf)  

25 de septiembre 2020

[![](../2020091489.jpg)](https://reflejosdelaciudad.com.ar/14892020.pdf)  

18 de septiembre 2020

[![](../2020091488.jpg)](https://reflejosdelaciudad.com.ar/14882020.pdf)  

11 de septiembre 2020

[![](../2020091487.jpg)](https://reflejosdelaciudad.com.ar/14872020.pdf)  

4 de septiembre 2020

[![](../2020081486.jpg)](https://reflejosdelaciudad.com.ar/14862020.pdf)  

28 de agosto 2020

[![](../2020081485.jpg)](https://reflejosdelaciudad.com.ar/14852020.pdf)  

21 de agosto 2020

[![](../2020081484.jpg)](https://reflejosdelaciudad.com.ar/14842020.pdf)  

14 de agosto 2020

[![](../2020081483.jpg)](https://reflejosdelaciudad.com.ar/14832020.pdf)  

7 de agosto 2020

[![](../2020071482.jpg)](https://reflejosdelaciudad.com.ar/14822020.pdf)  

31 de julio 2020

[![](../2020071481.jpg)](https://reflejosdelaciudad.com.ar/14812020.pdf)  

24 de julio 2020

[![](../2020071480.jpg)](https://reflejosdelaciudad.com.ar/14802020.pdf)  

17 de julio 2020

[![](../2020071479.jpg)](https://reflejosdelaciudad.com.ar/14792020.pdf)  

10 de julio 2020

[![](../2020071478.jpg)](https://reflejosdelaciudad.com.ar/14782020.pdf)  

3 de julio 2020

[![](../2020061477.jpg)](https://reflejosdelaciudad.com.ar/14772020.pdf)  

26 de junio 2020

[![](../2020061476.jpg)](https://reflejosdelaciudad.com.ar/14762020.pdf)  

19 de junio 2020

[![](../2020061475.jpg)](https://reflejosdelaciudad.com.ar/14752020.pdf)  

12 de junio 2020

[![](../2020061474.jpg)](https://reflejosdelaciudad.com.ar/14742020.pdf)  

5 de junio 2020

[![](../2020051473.jpg)](https://reflejosdelaciudad.com.ar/14732020.pdf)  

29 de mayo 2020

[![](../2020051472.jpg)](https://reflejosdelaciudad.com.ar/14722020.pdf)  

22 de mayo 2020

[![](../2020051471.jpg)](https://reflejosdelaciudad.com.ar/14712020.pdf)  

15 de mayo 2020

[![](../2020051470.jpg)](https://reflejosdelaciudad.com.ar/14702020.pdf)  

8 de mayo 2020

[![](../2020051469.jpg)](https://reflejosdelaciudad.com.ar/14692020.pdf)  

1 de mayo 2020

[![](../2020041468.jpg)](https://reflejosdelaciudad.com.ar/14682020.pdf)  

24 de abril 2020

[![](../2020041467.jpg)](https://reflejosdelaciudad.com.ar/14672020.pdf)  

17 de abril 2020

[![](../2020041466.jpg)](https://reflejosdelaciudad.com.ar/14662020.pdf)  

10 de abril 2020

[![](../2020041465.jpg)](https://reflejosdelaciudad.com.ar/14652020.pdf)  

3 de abril 2020

[![](../2020031464.jpg)](https://reflejosdelaciudad.com.ar/14642020.pdf)  

27 de marzo 2020

[![](../2020031463.jpg)](https://reflejosdelaciudad.com.ar/14632020.pdf)  

20 de marzo 2020

[![](../2020031462.jpg)](https://reflejosdelaciudad.com.ar/14622020.pdf)  

13 de marzo 2020

[![](../2020031461.jpg)](https://reflejosdelaciudad.com.ar/14612020.pdf)  

6 de marzo 2020

[![](../2020021460.jpg)](https://reflejosdelaciudad.com.ar/14602020.pdf)  

28 de febrero 2020

[![](../2020021459.jpg)](https://reflejosdelaciudad.com.ar/14592020.pdf)  

21 de febrero 2020

[![](../2020021458.jpg)](https://reflejosdelaciudad.com.ar/14582020.pdf)  

14 de febrero 2020

[![](../2020011457.jpg)](https://reflejosdelaciudad.com.ar/14572020.pdf)  

31 de enero 2020

[![](../2020011456.jpg)](https://reflejosdelaciudad.com.ar/14562020.pdf)  

24 de enero 2020

[![](../2020011455.jpg)](https://reflejosdelaciudad.com.ar/14552020.pdf)  

17 de enero 2020

[![](../2020011454.jpg)](https://reflejosdelaciudad.com.ar/14542020.pdf)  

10 de enero 2020
"""

MESES = {
    'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
    'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
    'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
}

def parse_fecha(texto):
    """Convierte '13 de marzo 2026' a '2026-03-13'. Retorna None si no puede."""
    # Limpiar prefijos como "SUPLEMENTO" y sufijos como "+ Suplemento Mujer"
    texto = re.sub(r'(?i)(suplemento\s*)', '', texto).strip()
    texto = re.sub(r'\+.*$', '', texto).strip()
    m = re.match(r'(\d{1,2})\s+de\s+(\w+)\s+(\d{4})', texto.strip(), re.IGNORECASE)
    if not m:
        return None
    dia, mes_str, anio = m.group(1), m.group(2).lower(), m.group(3)
    mes = MESES.get(mes_str)
    if not mes:
        return None
    return f"{anio}-{mes}-{dia.zfill(2)}"

# Regex: captura URL del PDF y texto del título en el renglón siguiente
pattern = re.compile(
    r'\[!\[\]\([^)]+\)\]\((https://reflejosdelaciudad\.com\.ar/[^)]+\.pdf)\)\s*\n\n(.+?)(?=\n)',
    re.MULTILINE
)

ediciones = []
for m in pattern.finditer(CONTENT):
    url    = m.group(1).strip()
    titulo = m.group(2).strip()
    fecha  = parse_fecha(titulo)
    ediciones.append({
        "titulo": titulo,
        "url":    url,
        "fecha":  fecha or ""
    })

# Guardar JSON
output_path = r'C:\Users\Tino\Desktop\reflejos-de-la-ciudad\scripts\ediciones.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(ediciones, f, ensure_ascii=False, indent=2)

print(f"Total ediciones extraídas: {len(ediciones)}")
print("\nPrimeras 5 entradas:")
for e in ediciones[:5]:
    print(json.dumps(e, ensure_ascii=False))
print("\nÚltimas 3 entradas:")
for e in ediciones[-3:]:
    print(json.dumps(e, ensure_ascii=False))

# Verificar fechas nulas
sin_fecha = [e for e in ediciones if not e['fecha']]
if sin_fecha:
    print(f"\n⚠️  Entradas SIN fecha parseada ({len(sin_fecha)}):")
    for e in sin_fecha:
        print(f"  titulo: {e['titulo']}  url: {e['url']}")
else:
    print("\n✅ Todas las fechas se parsearon correctamente.")
