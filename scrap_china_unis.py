#!/usr/bin/env python3
"""Build a seed catalogue of 100 leading Chinese public universities.

The catalogue is deliberately kept as a local fallback so a blocked or unavailable
public API cannot produce an incomplete seed file. Wikipedia/Wikimedia are used to
refresh descriptions and campus images when available.
"""
from __future__ import annotations

import json
import re
import time
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import requests

OUTPUT = Path(__file__).resolve().parent / "prisma" / "data" / "universities.json"
WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php"
COMMONS_API = "https://commons.wikimedia.org/w/api.php"
TIMEOUT = 15
HEADERS = {"User-Agent": "StudichanUniversitySeed/1.0 (educational catalogue)"}

# nameEn|nameCn|nameRu|city|province|approximate QS rank|strengths|domain
CATALOGUE = """
Tsinghua University|清华大学|Университет Цинхуа|Пекин|Пекин|25|инженерия, компьютерные науки и архитектура|tsinghua.edu.cn
Peking University|北京大学|Пекинский университет|Пекин|Пекин|14|естественные науки, медицина, право и гуманитарные науки|pku.edu.cn
Fudan University|复旦大学|Университет Фудань|Шанхай|Шанхай|30|медицина, экономика, менеджмент и гуманитарные науки|fudan.edu.cn
Shanghai Jiao Tong University|上海交通大学|Шанхайский университет Цзяотун|Шанхай|Шанхай|50|инженерия, медицина и менеджмент|sjtu.edu.cn
Zhejiang University|浙江大学|Чжэцзянский университет|Ханчжоу|Чжэцзян|47|инженерия, медицина, сельское хозяйство и технологии|zju.edu.cn
University of Science and Technology of China|中国科学技术大学|Университет науки и технологий Китая|Хэфэй|Аньхой|137|физика, химия, математика и компьютерные науки|ustc.edu.cn
Nanjing University|南京大学|Нанкинский университет|Нанкин|Цзянсу|145|естественные науки, астрономия, химия и гуманитарные науки|nju.edu.cn
Wuhan University|武汉大学|Уханьский университет|Ухань|Хубэй|194|геодезия, медицина, право и гуманитарные науки|whu.edu.cn
Harbin Institute of Technology|哈尔滨工业大学|Харбинский технологический институт|Харбин|Хэйлунцзян|256|космическая техника, робототехника и инженерия|hit.edu.cn
Beijing Normal University|北京师范大学|Пекинский педагогический университет|Пекин|Пекин|262|образование, психология, география и гуманитарные науки|bnu.edu.cn
Tongji University|同济大学|Университет Тунцзи|Шанхай|Шанхай|192|архитектура, гражданское строительство и транспорт|tongji.edu.cn
Beijing Institute of Technology|北京理工大学|Пекинский технологический институт|Пекин|Пекин|340|аэрокосмическая техника, оптика и инженерия|bit.edu.cn
Huazhong University of Science and Technology|华中科技大学|Хуачжунский университет науки и технологий|Ухань|Хубэй|275|медицина, инженерия и компьютерные науки|hust.edu.cn
Tianjin University|天津大学|Тяньцзиньский университет|Тяньцзинь|Тяньцзинь|269|химическая технология, архитектура и инженерия|tju.edu.cn
Sun Yat-sen University|中山大学|Университет Сунь Ятсена|Гуанчжоу|Гуандун|276|медицина, бизнес и естественные науки|sysu.edu.cn
Nankai University|南开大学|Нанькайский университет|Тяньцзинь|Тяньцзинь|355|экономика, химия, математика и история|nankai.edu.cn
Southeast University|东南大学|Юго-Восточный университет|Нанкин|Цзянсу|404|архитектура, электроника и гражданское строительство|seu.edu.cn
Xi'an Jiaotong University|西安交通大学|Сианьский университет Цзяотун|Сиань|Шэньси|334|энергетика, инженерия, менеджмент и медицина|xjtu.edu.cn
Beijing University of Aeronautics and Astronautics|北京航空航天大学|Пекинский университет аэронавтики и астронавтики|Пекин|Пекин|383|авиакосмическая техника, робототехника и информатика|buaa.edu.cn
Shandong University|山东大学|Шаньдунский университет|Цзинань|Шаньдун|540|медицина, математика, экономика и гуманитарные науки|sdu.edu.cn
Xiamen University|厦门大学|Сямэньский университет|Сямынь|Фуцзянь|362|экономика, химия, менеджмент и океанология|xmu.edu.cn
Sichuan University|四川大学|Сычуаньский университет|Чэнду|Сычуань|336|медицина, стоматология, инженерия и гуманитарные науки|scu.edu.cn
Zhongnan University of Economics and Law|中南财经政法大学|Чжуннаньский университет экономики и права|Ухань|Хубэй|701|экономика, финансы, право и менеджмент|zuel.edu.cn
Beijing Foreign Studies University|北京外国语大学|Пекинский университет иностранных языков|Пекин|Пекин|801|иностранные языки, международные отношения и перевод|bfsu.edu.cn
University of Chinese Academy of Sciences|中国科学院大学|Университет Китайской академии наук|Пекин|Пекин|=|естественные науки, инженерия и исследовательские программы|ucas.ac.cn
Renmin University of China|中国人民大学|Китайский народный университет|Пекин|Пекин|621|экономика, право, социология и журналистика|ruc.edu.cn
Beijing University of Chemical Technology|北京化工大学|Пекинский университет химической технологии|Пекин|Пекин|=|химическая технология, материалы и биоинженерия|buct.edu.cn
Beijing Jiaotong University|北京交通大学|Пекинский транспортный университет|Пекин|Пекин|=|транспорт, логистика, информатика и инженерия|bjtu.edu.cn
Beijing University of Technology|北京工业大学|Пекинский технологический университет|Пекин|Пекин|=|инженерия, компьютерные науки и материалы|bjut.edu.cn
University of International Business and Economics|对外经济贸易大学|Университет международного бизнеса и экономики|Пекин|Пекин|=|международная торговля, финансы и экономика|uibe.edu.cn
Central University of Finance and Economics|中央财经大学|Центральный финансово-экономический университет|Пекин|Пекин|=|финансы, экономика, бухгалтерский учет и право|cufe.edu.cn
China Agricultural University|中国农业大学|Китайский сельскохозяйственный университет|Пекин|Пекин|=|агрономия, биотехнологии, ветеринария и пищевые науки|cau.edu.cn
China University of Petroleum|中国石油大学|Китайский нефтяной университет|Циндао|Шаньдун|=|нефтегазовая инженерия, геология и химическая технология|cup.edu.cn
China University of Mining and Technology|中国矿业大学|Китайский горный университет|Сюйчжоу|Цзянсу|=|горное дело, безопасность, геология и энергетика|cumt.edu.cn
Dalian University of Technology|大连理工大学|Даляньский технологический университет|Далянь|Ляонин|=|инженерия, химия, менеджмент и материалы|dlut.edu.cn
Northeastern University|东北大学|Северо-Восточный университет|Шэньян|Ляонин|=|металлургия, автоматизация, информатика и инженерия|neu.edu.cn
Jilin University|吉林大学|Цзилиньский университет|Чанчунь|Цзилинь|=|медицина, химия, автомобили и право|jlu.edu.cn
Northeast Normal University|东北师范大学|Северо-Восточный педагогический университет|Чанчунь|Цзилинь|=|образование, психология и гуманитарные науки|nenu.edu.cn
Northeast Forestry University|东北林业大学|Северо-Восточный лесотехнический университет|Харбин|Хэйлунцзян|=|лесное хозяйство, экология и инженерия|nefu.edu.cn
Northeast Agricultural University|东北农业大学|Северо-Восточный сельскохозяйственный университет|Харбин|Хэйлунцзян|=|сельское хозяйство, ветеринария и пищевые науки|neau.edu.cn
Lanzhou University|兰州大学|Ланьчжоуский университет|Ланьчжоу|Ганьсу|=|экология, физика, химия и тибетские исследования|lzu.edu.cn
Northwestern Polytechnical University|西北工业大学|Северо-Западный политехнический университет|Сиань|Шэньси|=|авиакосмическая техника, материалы и робототехника|nwpu.edu.cn
Northwest A&F University|西北农林科技大学|Северо-Западный университет сельского и лесного хозяйства|Янлин|Шэньси|=|агрономия, лесное хозяйство и биотехнологии|nwafu.edu.cn
Northwest University|西北大学|Северо-Западный университет|Сиань|Шэньси|=|геология, экономика, археология и химия|nwu.edu.cn
South China University of Technology|华南理工大学|Южно-Китайский технологический университет|Гуанчжоу|Гуандун|=|инженерия, материалы, архитектура и бизнес|scut.edu.cn
South China Normal University|华南师范大学|Южно-Китайский педагогический университет|Гуанчжоу|Гуандун|=|образование, психология и гуманитарные науки|scnu.edu.cn
Southwestern University of Finance and Economics|西南财经大学|Юго-Западный университет финансов и экономики|Чэнду|Сычуань|=|финансы, экономика и страхование|swufe.edu.cn
Southwestern University|西南大学|Юго-Западный университет|Чунцин|Чунцин|=|образование, психология, сельское хозяйство и биология|swu.edu.cn
Chongqing University|重庆大学|Чунцинский университет|Чунцин|Чунцин|=|архитектура, инженерия, энергетика и менеджмент|cqu.edu.cn
Hunan University|湖南大学|Хунаньский университет|Чанша|Хунань|=|архитектура, инженерия, химия и бизнес|hnu.edu.cn
Central South University|中南大学|Центральный южный университет|Чанша|Хунань|=|медицина, горное дело, транспорт и материалы|csu.edu.cn
Zhengzhou University|郑州大学|Чжэнчжоуский университет|Чжэнчжоу|Хэнань|=|медицина, химия, инженерия и экономика|zzu.edu.cn
Henan University|河南大学|Хэнаньский университет|Кайфын|Хэнань|=|образование, биология, история и химия|henu.edu.cn
East China Normal University|华东师范大学|Восточно-Китайский педагогический университет|Шанхай|Шанхай|=|образование, психология, география и информатика|ecnu.edu.cn
East China University of Science and Technology|华东理工大学|Восточно-Китайский университет науки и технологий|Шанхай|Шанхай|=|химическая технология, материалы и биоинженерия|ecust.edu.cn
Shanghai University|上海大学|Шанхайский университет|Шанхай|Шанхай|=|материалы, кино, бизнес и инженерия|shu.edu.cn
Shanghai University of Finance and Economics|上海财经大学|Шанхайский университет финансов и экономики|Шанхай|Шанхай|=|финансы, экономика и статистика|shufe.edu.cn
Shanghai International Studies University|上海外国语大学|Шанхайский университет иностранных языков|Шанхай|Шанхай|=|языки, перевод и международные отношения|shisu.edu.cn
ShanghaiTech University|上海科技大学|Шанхайский технический университет|Шанхай|Шанхай|=|биомедицина, физика, материалы и информатика|shanghaitech.edu.cn
Ningbo University|宁波大学|Нинбоский университет|Нинбо|Чжэцзян|=|океанология, медицина, бизнес и инженерия|nbu.edu.cn
China Academy of Art|中国美术学院|Китайская академия искусств|Ханчжоу|Чжэцзян|=|изобразительное искусство, дизайн и архитектура|caa.edu.cn
Nanjing University of Aeronautics and Astronautics|南京航空航天大学|Нанкинский университет аэронавтики и астронавтики|Нанкин|Цзянсу|=|авиакосмическая техника, механика и робототехника|nuaa.edu.cn
Nanjing University of Science and Technology|南京理工大学|Нанкинский университет науки и технологий|Нанкин|Цзянсу|=|оптика, инженерия, материалы и информатика|njust.edu.cn
Soochow University|苏州大学|Сучжоуский университет|Сучжоу|Цзянсу|=|медицина, материаловедение, право и текстиль|suda.edu.cn
Hohai University|河海大学|Университет Хохай|Нанкин|Цзянсу|=|гидротехника, водные ресурсы и инженерия|hhu.edu.cn
China Pharmaceutical University|中国药科大学|Китайский фармацевтический университет|Нанкин|Цзянсу|=|фармацевтика, медицина и биотехнологии|cpu.edu.cn
Xiamen University of Technology|厦门理工学院|Технологический университет Сямэня|Сямынь|Фуцзянь|=|инженерия, дизайн и бизнес|xmut.edu.cn
Fuzhou University|福州大学|Фучжоуский университет|Фучжоу|Фуцзянь|=|химия, инженерия, информатика и менеджмент|fzu.edu.cn
Guangzhou University|广州大学|Гуанчжоуский университет|Гуанчжоу|Гуандун|=|строительство, география, бизнес и информатика|gzhu.edu.cn
Jinan University|暨南大学|Университет Цзинань|Гуанчжоу|Гуандун|=|медицина, журналистика, экономика и фармацевтика|jnu.edu.cn
Shenzhen University|深圳大学|Шэньчжэньский университет|Шэньчжэнь|Гуандун|=|инженерия, финансы, медицина и компьютерные науки|szu.edu.cn
Hong Kong University of Science and Technology (Guangzhou)|香港科技大学（广州）|Гонконгский университет науки и технологий в Гуанчжоу|Гуанчжоу|Гуандун|=|информатика, инженерия, бизнес и искусственный интеллект|hkust-gz.edu.cn
Yunnan University|云南大学|Юньнаньский университет|Куньмин|Юньнань|=|экология, биология, этнология и химия|ynu.edu.cn
Guizhou University|贵州大学|Гуйчжоуский университет|Гуйян|Гуйчжоу|=|сельское хозяйство, инженерия, химия и информатика|gzu.edu.cn
Guangxi University|广西大学|Гуанси-Чжуанский университет|Наньнин|Гуанси|=|сельское хозяйство, инженерия и биология|gxnu.edu.cn
Hainan University|海南大学|Хайнаньский университет|Хайкоу|Хайнань|=|тропическое сельское хозяйство, право и океанология|hainanu.edu.cn
Tibet University|西藏大学|Тибетский университет|Лхаса|Тибет|=|тибетология, медицина, экология и языки|utibet.edu.cn
Inner Mongolia University|内蒙古大学|Внутренняя Монголия университет|Хух-Хото|Внутренняя Монголия|=|экология, монголоведение, химия и биология|imu.edu.cn
Xinjiang University|新疆大学|Синьцзянский университет|Урумчи|Синьцзян|=|геология, энергетика, химия и информатика|xju.edu.cn
Ningxia University|宁夏大学|Нинсяский университет|Иньчуань|Нинся|=|сельское хозяйство, экология и инженерия|nxu.edu.cn
Qinghai University|青海大学|Цинхайский университет|Синин|Цинхай|=|экология плато, медицина и сельское хозяйство|qhu.edu.cn
Shanxi University|山西大学|Шаньсийский университет|Тайюань|Шаньси|=|оптика, физика, химия и история|sxu.edu.cn
Taiyuan University of Technology|太原理工大学|Тайюаньский технологический университет|Тайюань|Шаньси|=|горное дело, материалы, инженерия и химия|tyut.edu.cn
Hebei University|河北大学|Хэбэйский университет|Баодин|Хэбэй|=|экономика, медицина, химия и история|hbu.edu.cn
Hebei University of Technology|河北工业大学|Хэбэйский технологический университет|Тяньцзинь|Хэбэй|=|инженерия, материалы, химия и электротехника|hebut.edu.cn
Yanshan University|燕山大学|Яньшаньский университет|Циньхуандао|Хэбэй|=|механика, материалы и электротехника|ysu.edu.cn
Ocean University of China|中国海洋大学|Океанологический университет Китая|Циндао|Шаньдун|=|океанология, рыбное хозяйство, биология и экология|ouc.edu.cn
China University of Geosciences|中国地质大学|Китайский геологический университет|Ухань|Хубэй|=|геология, геофизика, ресурсы и экология|cug.edu.cn
Wuhan University of Technology|武汉理工大学|Уханьский университет технологий|Ухань|Хубэй|=|материалы, транспорт, строительство и инженерия|whut.edu.cn
Hubei University|湖北大学|Хубэйский университет|Ухань|Хубэй|=|химия, биология, экономика и образование|hubu.edu.cn
Changsha University of Science and Technology|长沙理工大学|Чаншаский университет науки и технологий|Чанша|Хунань|=|транспорт, энергетика и гражданское строительство|csust.edu.cn
Nanchang University|南昌大学|Наньчанский университет|Наньчан|Цзянси|=|медицина, пищевые науки, материаловедение и инженерия|ncu.edu.cn
Anhui University|安徽大学|Аньхойский университет|Хэфэй|Аньхой|=|китайский язык, химия, информатика и право|ahu.edu.cn
University of Electronic Science and Technology of China|电子科技大学|Университет электронной науки и технологий Китая|Чэнду|Сычуань|=|электроника, телекоммуникации, информатика и искусственный интеллект|uestc.edu.cn
Xidian University|西安电子科技大学|Сианьский университет электронной науки и технологий|Сиань|Шэньси|=|электроника, связь, радар и кибербезопасность|xidian.edu.cn
Chengdu University of Technology|成都理工大学|Чэндуйский университет технологий|Чэнду|Сычуань|=|геология, ресурсы, ядерная техника и информатика|cdut.edu.cn
Chengdu University|成都大学|Чэндуйский университет|Чэнду|Сычуань|=|медицина, туризм, образование и инженерия|cdu.edu.cn
Wenzhou Medical University|温州医科大学|Медицинский университет Вэньчжоу|Вэньчжоу|Чжэцзян|=|медицина, офтальмология и фармацевтика|wmu.edu.cn
Capital Medical University|首都医科大学|Столичный медицинский университет|Пекин|Пекин|=|медицина, клинические исследования и общественное здоровье|ccmu.edu.cn
China Medical University|中国医科大学|Китайский медицинский университет|Шэньян|Ляонин|=|клиническая медицина, стоматология и фармацевтика|cmu.edu.cn
Nanjing Medical University|南京医科大学|Нанкинский медицинский университет|Нанкин|Цзянсу|=|медицина, общественное здоровье и фармацевтика|njmu.edu.cn
Southern Medical University|南方医科大学|Южный медицинский университет|Гуанчжоу|Гуандун|=|медицина, стоматология и общественное здоровье|smu.edu.cn
Tianjin Medical University|天津医科大学|Тяньцзиньский медицинский университет|Тяньцзинь|Тяньцзинь|=|клиническая медицина, фармацевтика и общественное здоровье|tmu.edu.cn
Beijing University of Chinese Medicine|北京中医药大学|Пекинский университет китайской медицины|Пекин|Пекин|=|традиционная китайская медицина, фармацевтика и медицина|bucm.edu.cn
Shanghai University of Traditional Chinese Medicine|上海中医药大学|Шанхайский университет традиционной китайской медицины|Шанхай|Шанхай|=|традиционная китайская медицина, фармакология и реабилитация|shutcm.edu.cn
Minzu University of China|中央民族大学|Центральный университет национальностей Китая|Пекин|Пекин|=|этнология, гуманитарные науки, право и социальные науки|minzu.edu.cn
Central Conservatory of Music|中央音乐学院|Центральная консерватория музыки|Пекин|Пекин|=|музыка, исполнительское искусство и теория искусства|ccom.edu.cn
China University of Geosciences (Beijing)|中国地质大学（北京）|Китайский геологический университет (Пекин)|Пекин|Пекин|=|геология, геофизика, ресурсы и экология|cugb.edu.cn
China University of Political Science and Law|中国政法大学|Китайский университет политологии и права|Пекин|Пекин|=|право, политология, криминология и государственное управление|cupl.edu.cn
Communication University of China|中国传媒大学|Китайский университет коммуникаций|Пекин|Пекин|=|журналистика, медиакоммуникации, кино и телевидение|cuc.edu.cn
North China Electric Power University|华北电力大学|Северо-Китайский электроэнергетический университет|Пекин|Пекин|=|энергетика, электротехника, инженерия и автоматизация|ncepu.edu.cn
Peking Union Medical College|北京协和医学院|Пекинский медицинский колледж Союза|Пекин|Пекин|=|медицина, клинические исследования и общественное здоровье|pumc.edu.cn
University of Science and Technology Beijing|北京科技大学|Пекинский университет науки и технологий|Пекин|Пекин|=|металлургия, материалы, инженерия и информатика|ustb.edu.cn
Central China Normal University|华中师范大学|Центральный педагогический университет Китая|Ухань|Хубэй|=|педагогика, психология, гуманитарные науки и информатика|ccnu.edu.cn
Harbin Engineering University|哈尔滨工程大学|Харбинский инженерный университет|Харбин|Хэйлунцзян|=|кораблестроение, морская техника, ядерная инженерия и информатика|hrbeu.edu.cn
""".strip()


def slugify(value: str) -> str:
    value = value.lower().replace("&", " and ")
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-")


def request_json(url: str, params: dict[str, Any]) -> dict[str, Any] | None:
    try:
        response = requests.get(url, params=params, headers=HEADERS, timeout=TIMEOUT)
        response.raise_for_status()
        return response.json()
    except (requests.RequestException, ValueError) as error:
        print(f"  network warning: {error}")
        return None


def wikipedia_data(name: str) -> dict[str, str]:
    data = request_json(WIKIPEDIA_API, {
        "action": "query", "format": "json", "formatversion": "2",
        "prop": "extracts|pageimages", "exintro": 1, "explaintext": 1,
        "piprop": "thumbnail", "pithumbsize": 1200, "titles": name,
    })
    page = (data or {}).get("query", {}).get("pages", [{}])[0]
    return {
        "description": (page.get("extract") or "").strip(),
        "image": page.get("thumbnail", {}).get("source", ""),
    }


def commons_image(name: str) -> str:
    data = request_json(COMMONS_API, {
        "action": "query", "format": "json", "generator": "search",
        "gsrsearch": f"{name} campus building", "gsrnamespace": 6, "gsrlimit": 1,
        "prop": "imageinfo", "iiprop": "url", "iiurlwidth": 1400,
    })
    pages = (data or {}).get("query", {}).get("pages", {})
    page = next(iter(pages.values()), {})
    return page.get("imageinfo", [{}])[0].get("thumburl", "")


def parse_catalogue() -> list[dict[str, Any]]:
    records = []
    for line in CATALOGUE.splitlines():
        fields = line.split("|")
        if len(fields) != 8:
            raise ValueError(f"Invalid catalogue row: {line}")
        name_en, name_cn, name_ru, city, province, qs, strengths, domain = fields
        records.append({
            "slug": slugify(name_en), "nameRu": name_ru, "nameEn": name_en,
            "nameCn": name_cn, "city": city, "province": province,
            "type": "Публичный", "rankingNational": len(records) + 1,
            "rankingWorld": int(qs) if qs != "=" else 700 + len(records),
            "website": f"https://www.{domain}/", "logoUrl": "", "coverUrl": "",
            "description": f"{name_ru} — государственный университет Китая в городе {city}. Сильные стороны вуза: {strengths}.",
            "specialties": strengths,
            "hasCscScholarship": True, "_strengths": strengths,
        })
    if len(records) != 115:
        raise ValueError(f"Expected 115 universities, got {len(records)}")
    return records


def enrich(record: dict[str, Any], index: int) -> None:
    print(f"[{index:3}/115] {record['nameEn']}")
    wiki = wikipedia_data(record["nameEn"])
    if wiki["description"]:
        clean = re.sub(r"\s+", " ", wiki["description"]).strip()
        if clean:
            record["description"] = f"{record['nameRu']} расположен в городе {record['city']}. {clean[:650]}"
    image = commons_image(record["nameEn"])
    if image:
        record["coverUrl"] = image
    elif wiki["image"]:
        record["coverUrl"] = wiki["image"]
    else:
        record["coverUrl"] = "https://images.unsplash.com/photo-1564981797816-1043664bf78d?auto=format&fit=crop&w=1400&q=85"
    domain = urlparse(record["website"]).hostname or ""
    record["logoUrl"] = wiki["image"] or f"https://www.google.com/s2/favicons?domain={domain}&sz=256"
    time.sleep(0.15)


def main() -> None:
    records = parse_catalogue()
    print(f"Preparing {len(records)} universities. Public API enrichment is best-effort.")
    for index, record in enumerate(records, 1):
        try:
            enrich(record, index)
        except Exception as error:  # A single bad source must not stop the seed.
            print(f"  enrichment warning: {error}")
            record["coverUrl"] = record["coverUrl"] or "https://images.unsplash.com/photo-1564981797816-1043664bf78d?auto=format&fit=crop&w=1400&q=85"
            domain = urlparse(record["website"]).hostname or ""
            record["logoUrl"] = record["logoUrl"] or f"https://www.google.com/s2/favicons?domain={domain}&sz=256"
        record.pop("_strengths", None)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Saved {len(records)} universities to {OUTPUT}")


if __name__ == "__main__":
    main()
