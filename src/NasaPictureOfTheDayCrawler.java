import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;

import org.json.*;
import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.io.Reader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.Charset;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.util.Date;
import java.net.MalformedURLException;
import java.net.ProtocolException;


//NOTE: THIS JAVA FILE REQUIRES THE JAVA-JSON.JAR BE ADDED TO BUILD PATH
//WHICH CAN BE FOUND IN THE BIN FOLDER AND CAN BE ADDED AS AN EXTERNAL JAR
public class NasaPictureOfTheDayCrawler {
	
	//Reads from a Buffered Reader object and returns it as a string
	private static String readAll(Reader rd) throws IOException {
		
		//Object making the string
		StringBuilder sb = new StringBuilder();
		
		//cp raw char at a time
		int cp;
		
		//Read until the end
		while ((cp = rd.read()) != -1) {
			sb.append((char) cp);
		}
		
		//return the string
		return sb.toString();
	}

	public static void main(String[] args) throws JSONException, ParseException {
		//Title's scope set here so it can be used in the catch 
		String title = "";
		
		//Make the folder for the Pictures of the Day
		String podPath = "Pictures of the Day";
		boolean podFile = (new File(podPath)).mkdir();
		
		//Set the start and end dates to iterate through
		LocalDate start = LocalDate.parse("2015-03-14"), end = LocalDate.parse("2016-10-02");
		LocalDate next = start.minusDays(1);
		
		//Start the iteration, one day at a time in YYYY-MM-DD format
		while ((next = next.plusDays(1)).isBefore(end.plusDays(1))) {
			//URL object to hit nasa's api
			URL url;
			//Hit the picture of the day api end point
			String url_string = "https://api.nasa.gov/planetary/apod?date=" + next.toString() + "&api_key=DDxbM6VV2kuusHvAsCQfZKThSQ2f5Li1gcGdsHyp";
			
			
			try {
				
				//OpenStream of the json raw text
				InputStream is = new URL(url_string).openStream();
				
				//Make Buffered Reader Object
				BufferedReader rd = new BufferedReader(new InputStreamReader(is, Charset.forName("UTF-8")));
				
				//Put the stream into a single string, then make a json object
				String jsonText = readAll(rd);
				JSONObject json = new JSONObject(jsonText);
				
				//Get the URL for the image, the title of the picture of the day, and the explanation of the picture
				String image_url_string = json.getString("url");
				title = json.getString("title");
				String explanation = json.getString("explanation");
				
				//Make a folder for this picture of the day
				boolean newFile = (new File(podPath + "/" + title)).mkdir();
				
				//Write the explanation to a file in the folder
				PrintWriter explanationToFile = new PrintWriter(podPath + "/" + title + "/explanation.txt");
				explanationToFile.println(explanation);
				explanationToFile.flush();
				explanationToFile.close();
				
				//Open the url containing the image
				InputStream image = new BufferedInputStream(new URL(image_url_string).openStream());
				
				//Output the image to a file to the Picture of the Day/title/Nasa_APOD_date.jpg path
				OutputStream out = new BufferedOutputStream(new FileOutputStream(podPath + "/" + title + "/Nasa_APOD_" + next.toString() + ".jpg"));
				
				//write bit by bit
				for (int i; (i = image.read()) != -1;) {
					out.write(i);
				}
				
				//Close the streams
				image.close();
				out.close();
			
			//Print which ones get skipped due to errors
			} catch (IOException e) {
				System.out.println(title + "Skipped");
				continue;
			}

		}

	}

}
