// Sticker IDs follow Panini convention: {FIFA_CODE}{number}
// e.g. MEX1 = Mexico Emblem, MEX2–MEX12 = players 1-11,
//      MEX13 = Team Photo, MEX14–MEX20 = players 12-18
// Source: Stickers_Mundial_2026_por_Grupos.xlsx

export const TEAMS = [
  // ── Group A ──────────────────────────────────────────────────────────────────
  {
    code: 'MEX', isoCode: 'mx', name: 'México',       flag: '🇲🇽', group: 'A', color: '#006847',
    players: ['Luis Malagón', 'Johan Vásquez', 'Jorge Sánchez', 'César Montes', 'Jesús Gallardo', 'Israel Reyes', 'Diego Laínez', 'Carlos Rodríguez', 'Edson Álvarez', 'Orbelín Pineda', 'Marcel Ruiz', 'Érick Sánchez', 'Hirving Lozano', 'Santiago Giménez', 'Raúl Jiménez', 'Alexis Vega', 'Roberto Alvarado', 'César Huerta'],
  },
  {
    code: 'RSA', isoCode: 'za', name: 'South Africa', flag: '🇿🇦', group: 'A', color: '#007A4D',
    players: ['Ronwen Williams', 'Sipho Chaine', 'Aubrey Modiba', 'Samukele Kabini', 'Mbekezeli Mbokazi', 'Khulumani Ndamane', 'Siyabonga Ngezana', 'Khuliso Mudau', 'Nkosinathi Sibisi', 'Teboho Mokoena', 'Thalente Mbatha', 'Bathusi Aubaas', 'Yaya Sithole', 'Sipho Mbule', 'Lyle Foster', 'Iqraam Rayners', 'Mohau Nkota', 'Oswin Appollis'],
  },
  {
    code: 'KOR', isoCode: 'kr', name: 'South Korea',  flag: '🇰🇷', group: 'A', color: '#CD2E3A',
    players: ['Hyeon-woo Jo', 'Seung-gyu Kim', 'Min-jae Kim', 'Yoo-min Cho', 'Young-woo Seol', 'Han-beom Lee', 'Tae-seok Lee', 'Myung-jae Lee', 'Jae-sung Lee', 'In-beom Hwang', 'Kang-in Lee', 'Seung-ho Paik', 'Jens Castrop', 'Dong-kyung Lee', 'Gue-sung Cho', 'Heung-min Son', 'Hee-chan Hwang', 'Hyeon-gyu Oh'],
  },
  {
    code: 'CZE', isoCode: 'cz', name: 'Czechia',      flag: '🇨🇿', group: 'A', color: '#D7141A',
    players: ['Matěj Kovář', 'Jindřich Staněk', 'Ladislav Krejčí', 'Vladimír Coufal', 'Jaroslav Zelený', 'Tomáš Holeš', 'David Zima', 'Michal Sadílek', 'Lukáš Provod', 'Lukáš Červ', 'Tomáš Souček', 'Pavel Šulc', 'Matěj Vydra', 'Vasil Kušej', 'Tomáš Chorý', 'Václav Černý', 'Adam Hložek', 'Patrik Schick'],
  },

  // ── Group B ──────────────────────────────────────────────────────────────────
  {
    code: 'CAN', isoCode: 'ca', name: 'Canada',        flag: '🇨🇦', group: 'B', color: '#FF0000',
    players: ['Dayne St. Clair', 'Alphonso Davies', 'Alistair Johnston', 'Samuel Adekugbe', 'Richie Laryea', 'Derek Cornelius', 'Moïse Bombito', 'Kamal Miller', 'Stephen Eustáquio', 'Ismaël Koné', 'Jonathan Osorio', 'Jacob Shaffelburg', 'Mathieu Choinière', 'Niko Sigur', 'Tajon Buchanan', 'Liam Millar', 'Cyle Larin', 'Jonathan David'],
  },
  {
    code: 'BIH', isoCode: 'ba', name: 'Bosnia y Herz.', flag: '🇧🇦', group: 'B', color: '#002395',
    players: ['Nikola Vasilj', 'Amer Dedić', 'Sead Kolašinac', 'Tarik Muharemović', 'Nihad Mujakić', 'Nikola Katić', 'Amir Hadžiahmetović', 'Benjamin Tahirović', 'Armin Gigović', 'Ivan Šunjić', 'Ivan Bašić', 'Dženis Burnić', 'Esmir Bajraktarević', 'Amar Memić', 'Ermedin Demirović', 'Edin Džeko', 'Samed Baždar', 'Haris Tabaković'],
  },
  {
    code: 'QAT', isoCode: 'qa', name: 'Qatar',          flag: '🇶🇦', group: 'B', color: '#8B0000',
    players: ['Meshaal Barsham', 'Sultan Al Brake', 'Lucas Mendes', 'Homam Ahmed', 'Boualem Khoukhi', 'Pedro Miguel', 'Tarek Salman', 'Mohamed Al-Mannai', 'Karim Boudiaf', 'Assim Madibo', 'Ahmed Fatehi', 'Mohammed Waad', 'Abdulaziz Hatem', 'Hassan Al-Haydos', 'Edmilson Junior', 'Akram Afif', 'Ahmed Al Ganehi', 'Almoez Ali'],
  },
  {
    code: 'SUI', isoCode: 'ch', name: 'Switzerland',    flag: '🇨🇭', group: 'B', color: '#FF0000',
    players: ['Gregor Kobel', 'Yvon Mvogo', 'Manuel Akanji', 'Ricardo Rodríguez', 'Nico Elvedi', 'Aurèle Amenda', 'Silvan Widmer', 'Granit Xhaka', 'Denis Zakaria', 'Remo Freuler', 'Fabian Rieder', 'Ardon Jashari', 'Johan Manzambi', 'Michel Aebischer', 'Breel Embolo', 'Rubén Vargas', 'Dan Ndoye', 'Zeki Amdouni'],
  },

  // ── Group C ──────────────────────────────────────────────────────────────────
  {
    code: 'BRA', isoCode: 'br', name: 'Brazil',         flag: '🇧🇷', group: 'C', color: '#009C3B',
    players: ['Alisson', 'Bento', 'Marquinhos', 'Éder Militão', 'Gabriel Magalhães', 'Danilo', 'Wesley', 'Lucas Paquetá', 'Casemiro', 'Bruno Guimarães', 'Luiz Henrique', 'Vinícius Júnior', 'Rodrygo', 'João Pedro', 'Matheus Cunha', 'Gabriel Martinelli', 'Raphinha', 'Estêvão'],
  },
  {
    code: 'MAR', isoCode: 'ma', name: 'Morocco',        flag: '🇲🇦', group: 'C', color: '#C1272D',
    players: ['Yassine Bounou', 'Munir El Kajoui', 'Achraf Hakimi', 'Noussair Mazraoui', 'Nayef Aguerd', 'Romain Saïss', 'Jawad El Yamiq', 'Adam Masina', 'Sofyan Amrabat', 'Azzedine Ounahi', 'Eliesse Ben Seghir', 'Bilal El Khannouss', 'Ismael Saibari', 'Youssef En-Nesyri', 'Abde Ezzalzouli', 'Soufiane Rahimi', 'Brahim Díaz', 'Ayoub El Kaabi'],
  },
  {
    code: 'HAI', isoCode: 'ht', name: 'Haití',          flag: '🇭🇹', group: 'C', color: '#00209F',
    players: ['Johny Placide', 'Carlens Arcus', 'Martin Expérience', 'Jean-Kévin Duverne', 'Ricardo Adé', 'Duke Lacroix', 'Garven Metusala', 'Hannes Delcroix', 'Leverton Pierre', 'Danley Jean Jacques', 'Jean-Ricner Bellegarde', 'Christopher Attys', 'Derrick Etienne Jr.', 'Josué Casimir', 'Rubén Providence', 'Duckens Nazon', 'Louicius Deedson', 'Frantzdy Pierrot'],
  },
  {
    code: 'SCO', isoCode: 'gb-sct', name: 'Scotland',   flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', group: 'C', color: '#003087',
    players: ['Angus Gunn', 'Jack Hendry', 'Kieran Tierney', 'Aaron Hickey', 'Andrew Robertson', 'Scott McKenna', 'John Souttar', 'Anthony Ralston', 'Grant Hanley', 'Scott McTominay', 'Billy Gilmour', 'Lewis Ferguson', 'Ryan Christie', 'Kenny McLean', 'John McGinn', 'Lyndon Dykes', 'Che Adams', 'Ben Doak'],
  },

  // ── Group D ──────────────────────────────────────────────────────────────────
  {
    code: 'USA', isoCode: 'us', name: 'USA',            flag: '🇺🇸', group: 'D', color: '#3C3B6E',
    players: ['Matt Freese', 'Chris Richards', 'Tim Ream', 'Mark McKenzie', 'Alex Freeman', 'Antonee Robinson', 'Tyler Adams', 'Tanner Tessmann', 'Weston McKennie', 'Christian Roldan', 'Timothy Weah', 'Diego Luna', 'Malik Tillman', 'Christian Pulisic', 'Brenden Aaronson', 'Ricardo Pepi', 'Haji Wright', 'Folarin Balogun'],
  },
  {
    code: 'PAR', isoCode: 'py', name: 'Paraguay',       flag: '🇵🇾', group: 'D', color: '#D52B1E',
    players: ['Roberto Fernández', 'Orlando Gill', 'Gustavo Gómez', 'Fabián Balbuena', 'Juan José Cáceres', 'Omar Alderete', 'Junior Alonso', 'Mathías Villasanti', 'Diego Gómez', 'Damián Bobadilla', 'Andrés Cubas', 'Matías Galarza Fonda', 'Julio Enciso', 'Alejandro Romero Gamarra', 'Miguel Almirón', 'Ramón Sosa', 'Ángel Romero', 'Antonio Sanabria'],
  },
  {
    code: 'AUS', isoCode: 'au', name: 'Australia',      flag: '🇦🇺', group: 'D', color: '#00843D',
    players: ['Mathew Ryan', 'Joe Gauci', 'Harry Souttar', 'Alessandro Circati', 'Jordan Bos', 'Aziz Behich', 'Cameron Burgess', 'Lewis Miller', 'Milos Degenek', 'Jackson Irvine', 'Riley McGree', 'Aiden O\'Neill', 'Connor Metcalfe', 'Patrick Yazbek', 'Craig Goodwin', 'Kusini Yengi', 'Nestory Irankunda', 'Mohamed Touré'],
  },
  {
    code: 'TUR', isoCode: 'tr', name: 'Turkey',         flag: '🇹🇷', group: 'D', color: '#E30A17',
    players: ['Uğurcan Çakır', 'Mert Müldür', 'Zeki Çelik', 'Abdülkerim Bardakcı', 'Çağlar Söyüncü', 'Merih Demiral', 'Ferdi Kadıoğlu', 'Kaan Ayhan', 'İsmail Yüksek', 'Hakan Çalhanoğlu', 'Orkun Kökçü', 'Arda Güler', 'İrfan Can Kahveci', 'Yunus Akgün', 'Can Uzun', 'Barış Alper Yılmaz', 'Kerem Aktürkoğlu', 'Kenan Yıldız'],
  },

  // ── Group E ──────────────────────────────────────────────────────────────────
  {
    code: 'GER', isoCode: 'de', name: 'Germany',        flag: '🇩🇪', group: 'E', color: '#464646',
    players: ['Marc-André ter Stegen', 'Jonathan Tah', 'David Raum', 'Nico Schlotterbeck', 'Antonio Rüdiger', 'Waldemar Anton', 'Ridle Baku', 'Maximilian Mittelstädt', 'Joshua Kimmich', 'Florian Wirtz', 'Felix Nmecha', 'Leon Goretzka', 'Jamal Musiala', 'Serge Gnabry', 'Kai Havertz', 'Leroy Sané', 'Karim Adeyemi', 'Nick Woltemade'],
  },
  {
    code: 'CUW', isoCode: 'cw', name: 'Curaçao',        flag: '🇨🇼', group: 'E', color: '#002B7F',
    players: ['Eloy Room', 'Armando Obispo', 'Sherel Floranus', 'Jurien Gaari', 'Joshua Brenet', 'Roshon van Eijma', 'Shurandy Sambo', 'Livano Comenencia', 'Godfried Roemeratoe', 'Juninho Bacuna', 'Leandro Bacuna', 'Tahith Chong', 'Kenji Gorré', 'Jearl Margaritha', 'Jürgen Locadia', 'Jeremy Antonisse', 'Gervane Kastaneer', 'Sontje Hansen'],
  },
  {
    code: 'CIV', isoCode: 'ci', name: "Côte d'Ivoire",  flag: '🇨🇮', group: 'E', color: '#F77F00',
    players: ['Yahia Fofana', 'Ghislain Konan', 'Wilfried Singo', 'Odilon Kossounou', 'Evan Ndicka', 'Willy Boly', 'Emmanuel Agbadou', 'Ousmane Diomande', 'Franck Kessié', 'Seko Fofana', 'Ibrahim Sangaré', 'Jean-Philippe Gbamin', 'Amad Diallo', 'Sébastien Haller', 'Simon Adingra', 'Yan Diomandé', 'Evann Guessand', 'Oumar Diakité'],
  },
  {
    code: 'ECU', isoCode: 'ec', name: 'Ecuador',         flag: '🇪🇨', group: 'E', color: '#FFD100',
    players: ['Hernán Galíndez', 'Gonzalo Valle', 'Piero Hincapié', 'Pervis Estupiñán', 'Willian Pacho', 'Ángelo Preciado', 'Joel Ordóñez', 'Moisés Caicedo', 'Alan Franco', 'Kendry Páez', 'Pedro Vite', 'John Yeboah', 'Leonardo Campana', 'Gonzalo Plata', 'Nilson Angulo', 'Alan Minda', 'Kevin Rodríguez', 'Enner Valencia'],
  },

  // ── Group F ──────────────────────────────────────────────────────────────────
  {
    code: 'NED', isoCode: 'nl', name: 'Netherlands',    flag: '🇳🇱', group: 'F', color: '#FF6600',
    players: ['Bart Verbruggen', 'Virgil van Dijk', 'Micky van de Ven', 'Jurrien Timber', 'Denzel Dumfries', 'Nathan Aké', 'Jeremie Frimpong', 'Jan Paul van Hecke', 'Tijjani Reijnders', 'Ryan Gravenberch', 'Teun Koopmeiners', 'Frenkie de Jong', 'Xavi Simons', 'Justin Kluivert', 'Memphis Depay', 'Donyell Malen', 'Wout Weghorst', 'Cody Gakpo'],
  },
  {
    code: 'JPN', isoCode: 'jp', name: 'Japan',           flag: '🇯🇵', group: 'F', color: '#BC002D',
    players: ['Zion Suzuki', 'Henry Heroki Mochizuki', 'Ayumu Seko', 'Junnosuke Suzuki', 'Shogo Taniguchi', 'Tsuyoshi Watanabe', 'Kaishu Sano', 'Yuki Soma', 'Ao Tanaka', 'Daichi Kamada', 'Takefusa Kubo', 'Ritsu Dōan', 'Keito Nakamura', 'Takumi Minamino', 'Shuto Machino', 'Junya Ito', 'Koki Ogawa', 'Ayase Ueda'],
  },
  {
    code: 'SWE', isoCode: 'se', name: 'Sweden',          flag: '🇸🇪', group: 'F', color: '#006AA7',
    players: ['Victor Johansson', 'Isak Hien', 'Gabriel Gudmundsson', 'Emil Holm', 'Victor Nilsson Lindelöf', 'Gustaf Lagerbielke', 'Lucas Bergvall', 'Hugo Larsson', 'Jesper Karlström', 'Yasin Ayari', 'Mattias Svanberg', 'Daniel Svensson', 'Ken Sema', 'Roony Bardghji', 'Dejan Kulusevski', 'Anthony Elanga', 'Alexander Isak', 'Viktor Gyökeres'],
  },
  {
    code: 'TUN', isoCode: 'tn', name: 'Tunisia',         flag: '🇹🇳', group: 'F', color: '#E70013',
    players: ['Béchir Ben Saïd', 'Aymen Dahmen', 'Van Valery', 'Montassar Talbi', 'Yassine Meriah', 'Ali Abdi', 'Dylan Bronn', 'Ellyes Skhiri', 'Aïssa Laïdouni', 'Ferjani Sassi', 'Mohamed Ali Ben Romdhane', 'Hannibal Mejbri', 'Elias Achouri', 'Elias Saad', 'Hazem Mastouri', 'Ismaël Gharbi', 'Sayfallah Ltaief', 'Naïm Sliti'],
  },

  // ── Group G ──────────────────────────────────────────────────────────────────
  {
    code: 'BEL', isoCode: 'be', name: 'Belgium',         flag: '🇧🇪', group: 'G', color: '#000000',
    players: ['Thibaut Courtois', 'Arthur Theate', 'Timothy Castagne', 'Zeno Debast', 'Brandon Mechele', 'Maxim De Cuyper', 'Thomas Meunier', 'Youri Tielemans', 'Amadou Onana', 'Nicolas Raskin', 'Alexis Saelemaekers', 'Hans Vanaken', 'Kevin De Bruyne', 'Jérémy Doku', 'Charles De Ketelaere', 'Leandro Trossard', 'Loïs Openda', 'Romelu Lukaku'],
  },
  {
    code: 'EGY', isoCode: 'eg', name: 'Egypt',            flag: '🇪🇬', group: 'G', color: '#C8102E',
    players: ['Mohamed El Shenawy', 'Mohamed Hany', 'Mohamed Hamdy', 'Yasser Ibrahim', 'Khaled Sobhi', 'Ramy Rabia', 'Hossam Abdelmaguid', 'Ahmed Fattouh', 'Marwan Attia', 'Zizo', 'Hamdy Fathy', 'Mohamed Magdy', 'Emam Ashour', 'Osama Faisal', 'Mohamed Salah', 'Mostafa Mohamed', 'Trézéguet', 'Omar Marmoush'],
  },
  {
    code: 'IRN', isoCode: 'ir', name: 'Iran',              flag: '🇮🇷', group: 'G', color: '#239F40',
    players: ['Alireza Beiranvand', 'Morteza Pouraliganji', 'Ehsan Hajsafi', 'Milad Mohammadi', 'Shojae Khalilzadeh', 'Ramin Rezaeian', 'Hossein Kanaani', 'Sadegh Moharrami', 'Saleh Hardani', 'Saeed Ezatolahi', 'Saman Ghoddos', 'Omid Noorafkan', 'Roozbeh Cheshmi', 'Mohammad Mohebi', 'Sardar Azmoun', 'Mehdi Taremi', 'Alireza Jahanbakhsh', 'Ali Gholizadeh'],
  },
  {
    code: 'NZL', isoCode: 'nz', name: 'New Zealand',      flag: '🇳🇿', group: 'G', color: '#000000',
    players: ['Max Crocombe', 'Alex Paulsen', 'Michael Boxall', 'Liberato Cacace', 'Tim Payne', 'Tyler Bindon', 'Francis de Vries', 'Finn Surman', 'Joe Bell', 'Sarpreet Singh', 'Ryan Thomas', 'Matthew Garbett', 'Marko Stamenić', 'Ben Old', 'Chris Wood', 'Elijah Just', 'Callum McCowatt', 'Kosta Barbarouses'],
  },

  // ── Group H ──────────────────────────────────────────────────────────────────
  {
    code: 'ESP', isoCode: 'es', name: 'Spain',            flag: '🇪🇸', group: 'H', color: '#AA151B',
    players: ['Unai Simón', 'Robin Le Normand', 'Aymeric Laporte', 'Dean Huijsen', 'Pedro Porro', 'Dani Carvajal', 'Marc Cucurella', 'Martín Zubimendi', 'Rodri', 'Pedri', 'Fabián Ruiz', 'Mikel Merino', 'Lamine Yamal', 'Dani Olmo', 'Nico Williams', 'Ferran Torres', 'Álvaro Morata', 'Mikel Oyarzabal'],
  },
  {
    code: 'CPV', isoCode: 'cv', name: 'Cabo Verde',       flag: '🇨🇻', group: 'H', color: '#003893',
    players: ['Vozinha', 'Logan Costa', 'Pico', 'Diney', 'Steven Moreira', 'Wagner Pina', 'João Paulo', 'Yannick Semedo', 'Kevin Pina', 'Patrick Andrade', 'Jamiro Monteiro', 'Deroy Duarte', 'Garry Rodrigues', 'Jovane Cabral', 'Ryan Mendes', 'Dailon Livramento', 'Willy Semedo', 'Bebé'],
  },
  {
    code: 'KSA', isoCode: 'sa', name: 'Saudi Arabia',     flag: '🇸🇦', group: 'H', color: '#006C35',
    players: ['Nawaf Alaqidi', 'Abdulrahman Al-Sanbi', 'Saud Abdulhamid', 'Nawaf Boushal', 'Jihad Thakri', 'Moteb Al-Harbi', 'Hassan Al-Tambakti', 'Musab Al-Juwayr', 'Ziyad Al-Johani', 'Abdullah Al-Khaibari', 'Nasser Al-Dawsari', 'Saleh Abu Al-Shamat', 'Marwan Al-Sahafi', 'Salem Al-Dawsari', 'Abdulrahman Al-Aboud', 'Firas Al-Buraikan', 'Saleh Al-Shehri', 'Abdullah Al-Hamdan'],
  },
  {
    code: 'URU', isoCode: 'uy', name: 'Uruguay',           flag: '🇺🇾', group: 'H', color: '#5EB6E4',
    players: ['Sergio Rochet', 'Santiago Mele', 'Ronald Araújo', 'José María Giménez', 'Sebastián Cáceres', 'Mathías Olivera', 'Guillermo Varela', 'Nahitan Nández', 'Federico Valverde', 'Giorgian De Arrascaeta', 'Rodrigo Bentancur', 'Manuel Ugarte', 'Nicolás de la Cruz', 'Maxi Araújo', 'Darwin Núñez', 'Federico Viñas', 'Rodrigo Aguirre', 'Facundo Pellistri'],
  },

  // ── Group I ──────────────────────────────────────────────────────────────────
  {
    code: 'FRA', isoCode: 'fr', name: 'France',           flag: '🇫🇷', group: 'I', color: '#002395',
    players: ['Mike Maignan', 'Theo Hernández', 'William Saliba', 'Jules Koundé', 'Ibrahima Konaté', 'Dayot Upamecano', 'Lucas Digne', 'Aurélien Tchouaméni', 'Eduardo Camavinga', 'Manu Koné', 'Adrien Rabiot', 'Michael Olise', 'Ousmane Dembélé', 'Bradley Barcola', 'Désiré Doué', 'Kingsley Coman', 'Hugo Ekitike', 'Kylian Mbappé'],
  },
  {
    code: 'SEN', isoCode: 'sn', name: 'Senegal',          flag: '🇸🇳', group: 'I', color: '#00853F',
    players: ['Édouard Mendy', 'Yehvann Diouf', 'Moussa Niakhaté', 'Abdoulaye Seck', 'Ismaïl Jakobs', 'El Hadji Malick Diouf', 'Kalidou Koulibaly', 'Idrissa Gana Gueye', 'Pape Matar Sarr', 'Pape Gueye', 'Habib Diarra', 'Lamine Camara', 'Sadio Mané', 'Ismaïla Sarr', 'Boulaye Dia', 'Iliman Ndiaye', 'Nicolas Jackson', 'Krépin Diatta'],
  },
  {
    code: 'IRQ', isoCode: 'iq', name: 'Iraq',              flag: '🇮🇶', group: 'I', color: '#007A36',
    players: ['Jalal Hassan', 'Rebin Sulaka', 'Hussein Ali', 'Akam Hashim', 'Merchas Doski', 'Zaid Tahseen', 'Manaf Younis', 'Zidane Iqbal', 'Amir Al-Ammari', 'Ibrahim Bayesh', 'Ali Jasim', 'Youssef Amyn', 'Aimar Sher', 'Marko Farji', 'Osama Rashid', 'Ali Al-Hamadi', 'Aymen Hussein', 'Mohanad Ali'],
  },
  {
    code: 'NOR', isoCode: 'no', name: 'Norway',            flag: '🇳🇴', group: 'I', color: '#EF2B2D',
    players: ['Ørjan Nyland', 'Julian Ryerson', 'Leo Østigård', 'Kristoffer Vassbakk Ajer', 'Marcus Holmgren Pedersen', 'David Møller Wolfe', 'Torbjørn Heggem', 'Morten Thorsby', 'Martin Ødegaard', 'Sander Berge', 'Andreas Schjelderup', 'Patrick Berg', 'Erling Haaland', 'Alexander Sørloth', 'Aron Dønnum', 'Jørgen Strand Larsen', 'Antonio Nusa', 'Oscar Bobb'],
  },

  // ── Group J ──────────────────────────────────────────────────────────────────
  {
    code: 'ARG', isoCode: 'ar', name: 'Argentina',        flag: '🇦🇷', group: 'J', color: '#75AADB',
    players: ['Emiliano Martínez', 'Nahuel Molina', 'Cristian Romero', 'Nicolás Otamendi', 'Nicolás Tagliafico', 'Leonardo Balerdi', 'Enzo Fernández', 'Alexis Mac Allister', 'Rodrigo De Paul', 'Exequiel Palacios', 'Leandro Paredes', 'Nico Paz', 'Franco Mastantuono', 'Nico González', 'Lionel Messi', 'Lautaro Martínez', 'Julián Álvarez', 'Giuliano Simeone'],
  },
  {
    code: 'ALG', isoCode: 'dz', name: 'Algeria',           flag: '🇩🇿', group: 'J', color: '#006233',
    players: ['Alexis Guendouz', 'Ramy Bensebaini', 'Youcef Atal', 'Rayan Aït-Nouri', 'Mohamed Amine Tougai', 'Aïssa Mandi', 'Ismael Bennacer', 'Houssem Aouar', 'Hicham Boudaoui', 'Ramiz Zerrouki', 'Nabil Bentaleb', 'Farés Chaibi', 'Riyad Mahrez', 'Saïd Benrahma', 'Anis Hadj Moussa', 'Amine Gouiri', 'Baghdad Bounedjah', 'Mohammed Amoura'],
  },
  {
    code: 'AUT', isoCode: 'at', name: 'Austria',           flag: '🇦🇹', group: 'J', color: '#ED2939',
    players: ['Alexander Schlager', 'Patrick Pentz', 'David Alaba', 'Kevin Danso', 'Philipp Lienhart', 'Stefan Posch', 'Philipp Mwene', 'Alexander Prass', 'Xaver Schlager', 'Marcel Sabitzer', 'Konrad Laimer', 'Florian Grillitsch', 'Nicolas Seiwald', 'Romano Schmid', 'Patrick Wimmer', 'Christoph Baumgartner', 'Michael Gregoritsch', 'Marko Arnautović'],
  },
  {
    code: 'JOR', isoCode: 'jo', name: 'Jordan',            flag: '🇯🇴', group: 'J', color: '#007A3D',
    players: ['Yazeed Abulaila', 'Ihsan Haddad', 'Mohammad Abu Hashish', 'Yazan Al-Arab', 'Abdallah Nasib', 'Saleem Obaid', 'Mohammad Abualnadi', 'Ibrahim Saadeh', 'Nizar Al-Rashdan', 'Noor Al-Rawabdeh', 'Mohannad Abu Taha', 'Amer Jamous', 'Mousa Al-Taamari', 'Yazan Al-Naimat', 'Mahmoud Al-Mardi', 'Ali Olwan', 'Mohammad Abu Zrayq', 'Ibrahim Sabra'],
  },

  // ── Group K ──────────────────────────────────────────────────────────────────
  {
    code: 'POR', isoCode: 'pt', name: 'Portugal',          flag: '🇵🇹', group: 'K', color: '#006600',
    players: ['Diogo Costa', 'José Sá', 'Rúben Dias', 'João Cancelo', 'Diogo Dalot', 'Nuno Mendes', 'Gonçalo Inácio', 'Bernardo Silva', 'Bruno Fernandes', 'Rúben Neves', 'Vitinha', 'João Neves', 'Cristiano Ronaldo', 'Francisco Trincão', 'João Félix', 'Gonçalo Ramos', 'Pedro Neto', 'Rafael Leão'],
  },
  {
    code: 'UZB', isoCode: 'uz', name: 'Uzbekistán',        flag: '🇺🇿', group: 'K', color: '#1EB53A',
    players: ['Otkir Yusupov', 'Farrukh Sayfiev', 'Sherzod Nasrullaev', 'Umar Eshmurodov', 'Husniddin Aliqulov', 'Rustamjon Ashurmatov', 'Khojiakbar Alijonov', 'Abdukodir Khusanov', 'Odiljon Hamrobekov', 'Otabek Shukurov', 'Jamshid Iskanderov', 'Azizbek Turgunboev', 'Khojimat Erkinov', 'Eldor Shomurodov', 'Oston Urunov', 'Jaloliddin Masharipov', 'Igor Sergeev', 'Abbosbek Fayzullaev'],
  },
  {
    code: 'COL', isoCode: 'co', name: 'Colombia',          flag: '🇨🇴', group: 'K', color: '#FCD116',
    players: ['Camilo Vargas', 'David Ospina', 'Dávinson Sánchez', 'Yerry Mina', 'Daniel Muñoz', 'Johan Mojica', 'Jhon Lucumí', 'Santiago Arias', 'Jefferson Lerma', 'Kevin Castaño', 'Richard Ríos', 'James Rodríguez', 'Juan Fernando Quintero', 'Jorge Carrascal', 'Jhon Arias', 'Jhon Córdoba', 'Luis Suárez', 'Luis Díaz'],
  },
  {
    code: 'COD', isoCode: 'cd', name: 'R.D. Congo',        flag: '🇨🇩', group: 'K', color: '#007FFF',
    players: ['Lionel Mpasi', 'Aaron Wan-Bissaka', 'Axel Tuanzebe', 'Arthur Masuaku', 'Chancel Mbemba', 'Joris Kayembe', 'Charles Pickel', "Ngal'ayel Mukau", 'Edo Kayembe', 'Samuel Moutoussamy', 'Noah Sadiki', 'Théo Bongonda', 'Meschak Elia', 'Yoane Wissa', 'Brian Cipenga', 'Fiston Mayele', 'Cédric Bakambu', 'Nathanaël Mbuku'],
  },

  // ── Group L ──────────────────────────────────────────────────────────────────
  {
    code: 'ENG', isoCode: 'gb-eng', name: 'England',       flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'L', color: '#CF091F',
    players: ['Jordan Pickford', 'John Stones', 'Marc Guéhi', 'Ezri Konsa', 'Trent Alexander-Arnold', 'Reece James', 'Dan Burn', 'Jordan Henderson', 'Declan Rice', 'Jude Bellingham', 'Cole Palmer', 'Morgan Rogers', 'Anthony Gordon', 'Phil Foden', 'Bukayo Saka', 'Harry Kane', 'Marcus Rashford', 'Ollie Watkins'],
  },
  {
    code: 'CRO', isoCode: 'hr', name: 'Croatia',            flag: '🇭🇷', group: 'L', color: '#E52B22',
    players: ['Dominik Livaković', 'Duško Ćaleta-Car', 'Joško Gvardiol', 'Josip Stanišić', 'Luka Vušković', 'Josip Šutalo', 'Kristijan Jakić', 'Luka Modrić', 'Mateo Kovačić', 'Martin Baturina', 'Lovro Majer', 'Mario Pašalić', 'Petar Sučić', 'Ivan Perišić', 'Marco Pašalić', 'Ante Budimir', 'Andrej Kramarić', 'Franjo Ivanović'],
  },
  {
    code: 'GHA', isoCode: 'gh', name: 'Ghana',              flag: '🇬🇭', group: 'L', color: '#006B3F',
    players: ['Lawrence Ati-Zigi', 'Tariq Lamptey', 'Mohammed Salisu', 'Alidu Seidu', 'Alexander Djiku', 'Gideon Mensah', 'Caleb Yirenkyi', 'Abdul Fatawu Issahaku', 'Thomas Partey', 'Salis Abdul Samed', 'Kamaldeen Sulemana', 'Mohammed Kudus', 'Iñaki Williams', 'Jordan Ayew', 'André Ayew', 'Joseph Paintsil', 'Osman Bukari', 'Antoine Semenyo'],
  },
  {
    code: 'PAN', isoCode: 'pa', name: 'Panamá',             flag: '🇵🇦', group: 'L', color: '#DA121A',
    players: ['Orlando Mosquera', 'Luis Mejía', 'Fidel Escobar', 'Andrés Andrade', 'Michael Amir Murillo', 'Eric Davis', 'José Córdoba', 'César Blackman', 'Cristian Martínez', 'Aníbal Godoy', 'Adalberto Carrasquilla', 'Édgar Bárcenas', 'Carlos Harvey', 'Ismael Díaz', 'José Fajardo', 'Cecilio Waterman', 'José Luis Rodríguez', 'Alberto Quintero'],
  },
]

// FWC special stickers — Panini IDs from Specials sheet
export const SPECIAL_STICKERS = [
  { id: '0',     name: 'Panini Logo',                                          rarity: 'rare',      emoji: '📖' },
  { id: 'FWC1',  name: 'Official Emblem 1',                                    rarity: 'rare',      emoji: '🌍' },
  { id: 'FWC2',  name: 'Official Emblem 2',                                    rarity: 'rare',      emoji: '🌍' },
  { id: 'FWC3',  name: 'Official Mascots',                                     rarity: 'rare',      emoji: '🎭' },
  { id: 'FWC4',  name: 'Official Slogan',                                      rarity: 'rare',      emoji: '📢' },
  { id: 'FWC5',  name: 'Official Ball',                                        rarity: 'rare',      emoji: '⚽' },
  { id: 'FWC6',  name: 'Host Country Emblem — Canada',                         rarity: 'rare',      emoji: '🍁' },
  { id: 'FWC7',  name: 'Host Country Emblem — Mexico',                         rarity: 'rare',      emoji: '🦅' },
  { id: 'FWC8',  name: 'Host Country Emblem — USA',                            rarity: 'rare',      emoji: '🦅' },
  { id: 'FWC9',  name: 'Team Photo (Italy 1934) — FIFA World Cup Italy 1934',  rarity: 'legendary', emoji: '🏆' },
  { id: 'FWC10', name: 'Team Photo (Uruguay 1950) — FIFA World Cup Brazil 1950', rarity: 'legendary', emoji: '🏆' },
  { id: 'FWC11', name: 'Team Photo (W. Germany 1954) — FIFA World Cup Switz. 1954', rarity: 'legendary', emoji: '🏆' },
  { id: 'FWC12', name: 'Team Photo (Brazil 1962) — FIFA World Cup Chile 1962', rarity: 'legendary', emoji: '🏆' },
  { id: 'FWC13', name: 'Team Photo (W. Germany 1974) — FIFA World Cup 1974',   rarity: 'legendary', emoji: '🏆' },
  { id: 'FWC14', name: 'Team Photo (Argentina 1986) — FIFA World Cup Mexico 1986', rarity: 'legendary', emoji: '🏆' },
  { id: 'FWC15', name: 'Team Photo (Brazil 1994) — FIFA World Cup USA 1994',   rarity: 'legendary', emoji: '🏆' },
  { id: 'FWC16', name: 'Team Photo (Brazil 2002) — FIFA World Cup Korea/Japan 2002', rarity: 'legendary', emoji: '🏆' },
  { id: 'FWC17', name: 'Team Photo (Italy 2006) — FIFA World Cup Germany 2006', rarity: 'legendary', emoji: '🏆' },
  { id: 'FWC18', name: 'Team Photo (Germany 2014) — FIFA World Cup Brazil 2014', rarity: 'legendary', emoji: '🏆' },
  { id: 'FWC19', name: 'Team Photo (Argentina 2022) — FIFA World Cup Qatar 2022', rarity: 'legendary', emoji: '🏆' },
  // Coca-Cola's Specials
  { id: 'CC1',  name: 'Lamine Yamal',      rarity: 'legendary', emoji: '⭐' },
  { id: 'CC2',  name: 'Joshua Kimmich',    rarity: 'legendary', emoji: '⭐' },
  { id: 'CC3',  name: 'Eduardo Camavinga', rarity: 'legendary', emoji: '⭐' },
  { id: 'CC4',  name: 'Joško Gvardiol',    rarity: 'legendary', emoji: '⭐' },
  { id: 'CC5',  name: 'Federico Valverde', rarity: 'legendary', emoji: '⭐' },
  { id: 'CC6',  name: 'Virgil van Dijk',   rarity: 'legendary', emoji: '⭐' },
  { id: 'CC7',  name: 'Alphonso Davies',   rarity: 'legendary', emoji: '⭐' },
  { id: 'CC8',  name: 'Raúl Jiménez',      rarity: 'legendary', emoji: '⭐' },
  { id: 'CC9',  name: 'William Saliba',    rarity: 'legendary', emoji: '⭐' },
  { id: 'CC10', name: 'Lautaro Martínez',  rarity: 'legendary', emoji: '⭐' },
  { id: 'CC11', name: 'Harry Kane',        rarity: 'legendary', emoji: '⭐' },
  { id: 'CC12', name: 'Antonee Robinson',  rarity: 'legendary', emoji: '⭐' },
]

// Generates 20 stickers per team matching Panini numbering:
//   ${code}1        → Emblem
//   ${code}2–12     → players 1–11
//   ${code}13       → Team Photo
//   ${code}14–20    → players 12–18
export function generateTeamStickers(team) {
  const stickers = []

  stickers.push({
    id: `${team.code}1`,
    teamCode: team.code,
    type: 'badge',
    rarity: 'rare',
    name: `${team.name} — Emblem`,
    number: 1,
  })

  team.players.slice(0, 11).forEach((playerName, i) => {
    stickers.push({
      id: `${team.code}${i + 2}`,
      teamCode: team.code,
      type: 'player',
      rarity: i < 2 ? 'legendary' : i < 5 ? 'rare' : 'common',
      name: playerName,
      number: i + 2,
    })
  })

  stickers.push({
    id: `${team.code}13`,
    teamCode: team.code,
    type: 'squad',
    rarity: 'rare',
    name: `${team.name} — Team Photo`,
    number: 13,
  })

  team.players.slice(11).forEach((playerName, i) => {
    stickers.push({
      id: `${team.code}${i + 14}`,
      teamCode: team.code,
      type: 'player',
      rarity: 'common',
      name: playerName,
      number: i + 14,
    })
  })

  return stickers
}

export const ALL_STICKERS = [
  ...TEAMS.flatMap(generateTeamStickers),
  ...SPECIAL_STICKERS.map((s) => ({ ...s, teamCode: 'SPEC', type: 'special' })),
]

export const RARITY_STYLES = {
  common:    { border: 'border-slate-700',      glow: '',                                    bg: 'bg-slate-800/60',  label: 'Common',    labelColor: 'text-slate-400' },
  rare:      { border: 'border-blue-500/60',    glow: 'shadow-blue-500/20 shadow-lg',        bg: 'bg-blue-950/40',   label: 'Rare',      labelColor: 'text-blue-400' },
  legendary: { border: 'border-amber-400/80',   glow: 'shadow-amber-400/30 shadow-xl animate-pulse-gold', bg: 'bg-amber-950/40', label: 'Legendary', labelColor: 'text-amber-400' },
}
